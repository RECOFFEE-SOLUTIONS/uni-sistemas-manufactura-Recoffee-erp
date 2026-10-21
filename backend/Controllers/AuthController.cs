using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly ICryptoService _cryptoService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        ITokenService tokenService,
        ICryptoService cryptoService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _cryptoService = cryptoService;
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
    /// desencriptación asimétrica de credenciales y emisión de JWT en Cookie HttpOnly.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login-rate-limit")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Usuario y contraseña son requeridos." });
        }

        var user = await _userManager.FindByNameAsync(request.Username)
                   ?? await _userManager.FindByEmailAsync(request.Username);

        if (user == null)
        {
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        // Desencriptar asimétricamente la contraseña recibida del cliente
        var clearPassword = _cryptoService.DecryptPassword(request.Password);

        var result = await _signInManager.CheckPasswordSignInAsync(user, clearPassword, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
            {
                return StatusCode(StatusCodes.Status423Locked, new { message = "Cuenta temporalmente bloqueada por demasiados intentos fallidos." });
            }
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        // Configuración estricta de Cookie de sesión JWT (HttpOnly, Secure condicional HTTPS/dev, SameSite)
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = Request.IsHttps ? SameSiteMode.Strict : SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Path = "/"
        };

        Response.Cookies.Append("recoffee_jwt", token, cookieOptions);

        _logger.LogInformation("Usuario {Username} autenticado exitosamente. Cookie HttpOnly establecida.", request.Username);

        // El token JWT NUNCA se retorna en el cuerpo JSON de la respuesta para evitar exposición
        return Ok(new SecureLoginResponse(
            "Autenticación exitosa. Credenciales seguras establecidas en Cookie HttpOnly.",
            new UserDto(user.Id, user.UserName ?? string.Empty, user.Email ?? string.Empty, roles)
        ));
    }

    /// <summary>
    /// Endpoint de Cierre de Sesión seguro que invalida la Cookie HttpOnly.
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("recoffee_jwt", new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = Request.IsHttps ? SameSiteMode.Strict : SameSiteMode.Lax,
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
        return Ok(new UserDto(user.Id, user.UserName ?? string.Empty, user.Email ?? string.Empty, roles));
    }
}
