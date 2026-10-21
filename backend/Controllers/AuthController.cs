using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly ICryptoService _cryptoService;
    private readonly ReCoffeeDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        ITokenService tokenService,
        ICryptoService cryptoService,
        ReCoffeeDbContext context,
        IWebHostEnvironment env,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _cryptoService = cryptoService;
        _context = context;
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Retorna la clave pública RSA en formato PEM para cifrado asimétrico en el cliente.
    /// </summary>
    [HttpGet("public-key")]
    [AllowAnonymous]
    public IActionResult GetPublicKey()
    {
        var publicKey = _cryptoService.GetPublicKeyPem();
        return Ok(new PublicKeyResponse(publicKey));
    }

    /// <summary>
    /// Endpoint de Login con Rate Limiting (5 peticiones/minuto por IP),
    /// registro de Historial de Accesos (AccessLogs), desencriptación asimétrica y Cookie HttpOnly.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login-rate-limit")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers.UserAgent.ToString();

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            await RecordAccessLog(ip, request.Username ?? "anon", false, "Usuario y contraseña vacíos", userAgent);
            return BadRequest(new { message = "Usuario y contraseña son requeridos." });
        }

        var user = await _userManager.FindByNameAsync(request.Username)
                   ?? await _userManager.FindByEmailAsync(request.Username);

        if (user == null)
        {
            await RecordAccessLog(ip, request.Username, false, "Usuario inexistente", userAgent);
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        // Desencriptar asimétricamente la contraseña recibida del cliente
        var clearPassword = _cryptoService.DecryptPassword(request.Password);

        var result = await _signInManager.CheckPasswordSignInAsync(user, clearPassword, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            string reason = result.IsLockedOut ? "Cuenta bloqueada temporalmente" : "Contraseña incorrecta";
            await RecordAccessLog(ip, request.Username, false, reason, userAgent);

            if (result.IsLockedOut)
            {
                return StatusCode(StatusCodes.Status423Locked, new { message = "Cuenta temporalmente bloqueada por demasiados intentos fallidos." });
            }
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        // Registrar acceso exitoso
        await RecordAccessLog(ip, request.Username, true, null, userAgent);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        // Configuración estricta de Cookie de sesión JWT (HttpOnly, Secure condicional HTTPS/dev, SameSite)
        // Configuración de Cookie JWT: Secure=false y SameSite=Lax exclusivamente en desarrollo para soporte Chromium
        bool isDev = _env.IsDevelopment();
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Path = "/"
        };

        Response.Cookies.Append("recoffee_jwt", token, cookieOptions);

        _logger.LogInformation("Usuario {Username} autenticado exitosamente. Cookie HttpOnly establecida.", request.Username);

        // Verificar si tiene contraseña temporal activa
        var securityProfile = await _context.UserSecurityProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
        bool mustChangePassword = securityProfile?.MustChangePassword ?? false;

        // El token JWT NUNCA se retorna en el cuerpo JSON de la respuesta para evitar exposición
        return Ok(new SecureLoginResponse(
            "Autenticación exitosa. Credenciales seguras establecidas en Cookie HttpOnly.",
            new UserDto(user.Id, user.UserName ?? string.Empty, user.Email ?? string.Empty, roles),
            mustChangePassword
        ));
    }

    /// <summary>
    /// Genera una contraseña temporal para el flujo "¿Olvidé mi clave?".
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrUsername))
        {
            return BadRequest(new { message = "Ingrese su usuario o correo registrado." });
        }

        var user = await _userManager.FindByNameAsync(request.EmailOrUsername)
                   ?? await _userManager.FindByEmailAsync(request.EmailOrUsername);

        if (user == null)
        {
            // Mensaje genérico por seguridad
            return Ok(new ForgotPasswordResponse(
                "Si la cuenta existe, se ha generado una clave temporal para el restablecimiento.",
                null,
                null
            ));
        }

        // Generar contraseña temporal
        string tempPassword = "Reset@" + Guid.NewGuid().ToString("N").Substring(0, 8) + "!";
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, tempPassword);

        if (!resetResult.Succeeded)
        {
            return BadRequest(new { message = "No se pudo restablecer la contraseña en este momento." });
        }

        var profile = await _context.UserSecurityProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
        if (profile == null)
        {
            profile = new UserSecurityProfile { UserId = user.Id };
            _context.UserSecurityProfiles.Add(profile);
        }
        profile.MustChangePassword = true;
        profile.IsTemporaryPassword = true;
        profile.TemporaryPassword = tempPassword;
        profile.ResetToken = resetToken;
        profile.ResetTokenExpiresAt = DateTime.UtcNow.AddHours(24);
        await _context.SaveChangesAsync();

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        await RecordAccessLog(ip, user.UserName ?? "system", true, "Generación de contraseña temporal vía Olvidé mi clave", Request.Headers.UserAgent.ToString());

        return Ok(new ForgotPasswordResponse(
            "Se ha generado una contraseña temporal con éxito. Deberá cambiarla al iniciar sesión.",
            tempPassword,
            resetToken
        ));
    }

    /// <summary>
    /// Cambia la contraseña (requerido para usuarios con contraseña temporal).
    /// </summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "La nueva contraseña debe tener al menos 6 caracteres." });
        }

        var username = User.Identity?.Name;
        IdentityUser? user = null;

        if (!string.IsNullOrEmpty(username))
        {
            user = await _userManager.FindByNameAsync(username);
        }

        if (user == null)
        {
            return Unauthorized(new { message = "Sesión no válida o expirada." });
        }

        var clearNewPassword = _cryptoService.DecryptPassword(request.NewPassword);

        IdentityResult changeResult;
        if (!string.IsNullOrWhiteSpace(request.ResetToken))
        {
            changeResult = await _userManager.ResetPasswordAsync(user, request.ResetToken, clearNewPassword);
        }
        else if (!string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            var clearCurrent = _cryptoService.DecryptPassword(request.CurrentPassword);
            changeResult = await _userManager.ChangePasswordAsync(user, clearCurrent, clearNewPassword);
        }
        else
        {
            // Forzar actualización si tiene contraseña temporal activa
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            changeResult = await _userManager.ResetPasswordAsync(user, resetToken, clearNewPassword);
        }

        if (!changeResult.Succeeded)
        {
            var err = string.Join(", ", changeResult.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Error al actualizar contraseña: {err}" });
        }

        // Marcar contraseña como definitiva
        var profile = await _context.UserSecurityProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
        if (profile != null)
        {
            profile.MustChangePassword = false;
            profile.IsTemporaryPassword = false;
            profile.TemporaryPassword = null;
            profile.LastPasswordChangeDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Contraseña actualizada exitosamente. Ya puede acceder a todos los módulos autorizados." });
    }

    /// <summary>
    /// Endpoint de Cierre de Sesión seguro que invalida la Cookie HttpOnly.
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        bool isDev = _env.IsDevelopment();
        Response.Cookies.Delete("recoffee_jwt", new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.Strict,
            Path = "/"
        });

        return Ok(new { message = "Sesión cerrada correctamente y cookie eliminada." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByNameAsync(username);
        if (user == null)
        {
            return NotFound();
        }

        var roles = await _userManager.GetRolesAsync(user);
        var profile = await _context.UserSecurityProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);

        return Ok(new
        {
            id = user.Id,
            username = user.UserName ?? string.Empty,
            email = user.Email ?? string.Empty,
            roles = roles,
            mustChangePassword = profile?.MustChangePassword ?? false
        });
    }

    private async Task RecordAccessLog(string ip, string username, bool success, string? reason, string? userAgent)
    {
        try
        {
            _context.AccessLogs.Add(new AccessLog
            {
                IpAddress = ip,
                Username = username,
                Success = success,
                FailureReason = reason,
                UserAgent = userAgent?.Length > 255 ? userAgent.Substring(0, 255) : userAgent,
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("No se pudo registrar log de acceso: {Message}", ex.Message);
        }
    }
}
