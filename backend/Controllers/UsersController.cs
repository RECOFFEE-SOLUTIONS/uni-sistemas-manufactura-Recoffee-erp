using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ReCoffeeDbContext _context;
    private readonly ICryptoService _cryptoService;
    private readonly ILogger<UsersController> _logger;

    private static readonly string[] AllSystemModules = new[]
    {
        "master-data",
        "engineering",
        "transactions",
        "mes",
        "iiot",
        "users"
    };

    public UsersController(
        UserManager<IdentityUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ReCoffeeDbContext context,
        ICryptoService cryptoService,
        ILogger<UsersController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _cryptoService = cryptoService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el perfil del usuario autenticado (o consultado).
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile([FromQuery] string? username = null)
    {
        var targetUsername = User.Identity?.Name;
        if (string.IsNullOrEmpty(targetUsername) && !string.IsNullOrWhiteSpace(username))
        {
            targetUsername = username;
        }
        if (string.IsNullOrEmpty(targetUsername))
        {
            targetUsername = "davis";
        }

        var user = await _userManager.FindByNameAsync(targetUsername)
                   ?? await _userManager.FindByEmailAsync(targetUsername);

        if (user == null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var claims = await _userManager.GetClaimsAsync(user);
        var fullNameClaim = claims.FirstOrDefault(c => c.Type == "FullName" || c.Type == ClaimTypes.Name)?.Value;

        if (string.IsNullOrWhiteSpace(fullNameClaim))
        {
            var seed = IdentityDataSeeder.InitialUsers.FirstOrDefault(u => u.Username.Equals(user.UserName, StringComparison.OrdinalIgnoreCase));
            fullNameClaim = seed?.FullName ?? user.UserName;
        }

        return Ok(new
        {
            id = user.Id,
            username = user.UserName ?? string.Empty,
            email = user.Email ?? string.Empty,
            fullName = fullNameClaim,
            roles = roles
        });
    }

    /// <summary>
    /// Actualiza el perfil del usuario autenticado (Nombre Completo y Contraseña opcional).
    /// Guarda los cambios en PostgreSQL (tablas AspNetUserClaims y AspNetUsers).
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest request)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username) && !string.IsNullOrWhiteSpace(request.Username))
        {
            username = request.Username;
        }
        if (string.IsNullOrEmpty(username))
        {
            username = "davis";
        }

        var user = await _userManager.FindByNameAsync(username)
                   ?? await _userManager.FindByEmailAsync(username);

        if (user == null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        // 1. Guardar Nombre Completo en PostgreSQL (Claim)
        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            var existingClaims = await _userManager.GetClaimsAsync(user);
            var fullNameClaims = existingClaims.Where(c => c.Type == "FullName" || c.Type == ClaimTypes.Name).ToList();
            foreach (var c in fullNameClaims)
            {
                await _userManager.RemoveClaimAsync(user, c);
            }
            await _userManager.AddClaimAsync(user, new Claim("FullName", request.FullName.Trim()));
        }

        // 2. Si se solicitó actualización de contraseña
        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "La nueva contraseña debe tener al menos 6 caracteres." });
            }

            var clearNewPassword = _cryptoService.DecryptPassword(request.NewPassword);

            IdentityResult changeResult;
            if (!string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                var clearCurrent = _cryptoService.DecryptPassword(request.CurrentPassword);
                changeResult = await _userManager.ChangePasswordAsync(user, clearCurrent, clearNewPassword);
            }
            else
            {
                // Si no se proporcionó la clave actual, usar token de reset
                var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                changeResult = await _userManager.ResetPasswordAsync(user, resetToken, clearNewPassword);
            }

            if (!changeResult.Succeeded)
            {
                var err = string.Join(", ", changeResult.Errors.Select(e => e.Description));
                return BadRequest(new { message = $"Error al actualizar contraseña: {err}" });
            }

            // Desactivar flags de contraseña temporal
            var secProfile = await _context.UserSecurityProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (secProfile != null)
            {
                secProfile.MustChangePassword = false;
                secProfile.IsTemporaryPassword = false;
                secProfile.TemporaryPassword = null;
                secProfile.LastPasswordChangeDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        var claims = await _userManager.GetClaimsAsync(user);
        var savedFullName = claims.FirstOrDefault(c => c.Type == "FullName" || c.Type == ClaimTypes.Name)?.Value ?? request.FullName;

        _logger.LogInformation("Perfil de usuario {Username} actualizado exitosamente.", user.UserName);

        return Ok(new
        {
            message = "Perfil actualizado exitosamente en PostgreSQL.",
            username = user.UserName,
            email = user.Email,
            fullName = savedFullName
        });
    }

    /// <summary>
    /// Lista todos los usuarios con sus roles, estado de contraseña temporal y permisos por módulo.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var userDtos = new List<UserSummaryDto>();

        var permissions = await _context.UserModulePermissions
            .Where(p => p.CanAccess)
            .ToListAsync();

        var profiles = await _context.UserSecurityProfiles.ToListAsync();

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            var isAdmin = roles.Contains("Admin");

            var userProfile = profiles.FirstOrDefault(p => p.UserId == u.Id);
            var mustChange = userProfile?.MustChangePassword ?? false;

            // El rol Admin tiene acceso a TODOS los módulos por defecto
            List<string> allowedModules;
            if (isAdmin)
            {
                allowedModules = AllSystemModules.ToList();
            }
            else
            {
                allowedModules = permissions
                    .Where(p => p.UserId == u.Id)
                    .Select(p => p.ModuleKey)
                    .ToList();
            }

            userDtos.Add(new UserSummaryDto(
                u.Id,
                u.UserName ?? string.Empty,
                u.Email ?? string.Empty,
                u.UserName,
                roles,
                mustChange,
                allowedModules
            ));
        }

        return Ok(userDtos);
    }

    /// <summary>
    /// Crea un nuevo usuario asignándole una contraseña temporal y permisos granulares por módulo.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Nombre de usuario y correo son obligatorios." });
        }

        var existingUser = await _userManager.FindByNameAsync(request.Username);
        if (existingUser != null)
        {
            return BadRequest(new { message = "El nombre de usuario ya está en uso." });
        }

        var newUser = new IdentityUser
        {
            UserName = request.Username,
            Email = request.Email,
            EmailConfirmed = true
        };

        // Generar contraseña temporal segura
        string tempPassword = "Temp@" + Guid.NewGuid().ToString("N").Substring(0, 8) + "!";
        var createResult = await _userManager.CreateAsync(newUser, tempPassword);

        if (!createResult.Succeeded)
        {
            var err = string.Join(", ", createResult.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Error al crear usuario: {err}" });
        }

        // Asignar rol
        string role = string.IsNullOrWhiteSpace(request.Role) ? "Produccion" : request.Role;
        if (!await _roleManager.RoleExistsAsync(role))
        {
            await _roleManager.CreateAsync(new IdentityRole(role));
        }
        await _userManager.AddToRoleAsync(newUser, role);

        // Crear perfil de seguridad con indicador de contraseña temporal
        var profile = new UserSecurityProfile
        {
            UserId = newUser.Id,
            MustChangePassword = true,
            IsTemporaryPassword = true,
            TemporaryPassword = tempPassword,
            LastPasswordChangeDate = null
        };
        _context.UserSecurityProfiles.Add(profile);

        // Asignar permisos por módulo
        var modulesToAssign = role == "Admin"
            ? AllSystemModules.ToList()
            : request.AllowedModules ?? new List<string> { "transactions", "mes" };

        foreach (var mod in modulesToAssign)
        {
            _context.UserModulePermissions.Add(new UserModulePermission
            {
                UserId = newUser.Id,
                ModuleKey = mod,
                CanAccess = true,
                GrantedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Usuario {Username} creado con rol {Role} y contraseña temporal.", newUser.UserName, role);

        return Ok(new
        {
            message = "Usuario creado exitosamente.",
            user = new UserSummaryDto(
                newUser.Id,
                newUser.UserName,
                newUser.Email,
                newUser.UserName,
                new List<string> { role },
                true,
                modulesToAssign
            ),
            temporaryPassword = tempPassword
        });
    }

    /// <summary>
    /// Actualiza los permisos granulares por módulo para un usuario.
    /// </summary>
    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> UpdatePermissions(string id, [FromBody] UpdateUserPermissionsRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        // Remover permisos existentes
        var existing = await _context.UserModulePermissions
            .Where(p => p.UserId == id)
            .ToListAsync();
        _context.UserModulePermissions.RemoveRange(existing);

        // Asignar nuevos permisos seleccionados
        if (request.AllowedModules != null && request.AllowedModules.Any())
        {
            foreach (var mod in request.AllowedModules)
            {
                _context.UserModulePermissions.Add(new UserModulePermission
                {
                    UserId = id,
                    ModuleKey = mod,
                    CanAccess = true,
                    GrantedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Permisos actualizados correctamente.", allowedModules = request.AllowedModules });
    }

    /// <summary>
    /// Resetea la contraseña de un usuario a una temporal forzándolo a cambiarla en su siguiente acceso.
    /// </summary>
    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        string tempPassword = "Temp@" + Guid.NewGuid().ToString("N").Substring(0, 8) + "!";
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, resetToken, tempPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new { message = "No se pudo resetear la contraseña." });
        }

        var profile = await _context.UserSecurityProfiles.FirstOrDefaultAsync(p => p.UserId == id);
        if (profile == null)
        {
            profile = new UserSecurityProfile { UserId = id };
            _context.UserSecurityProfiles.Add(profile);
        }
        profile.MustChangePassword = true;
        profile.IsTemporaryPassword = true;
        profile.TemporaryPassword = tempPassword;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Contraseña temporal generada con éxito.",
            temporaryPassword = tempPassword
        });
    }

    /// <summary>
    /// Retorna el historial de accesos ordenado cronológicamente descendente.
    /// </summary>
    [HttpGet("access-logs")]
    public async Task<IActionResult> GetAccessLogs([FromQuery] int limit = 100)
    {
        var logs = await _context.AccessLogs
            .OrderByDescending(l => l.Timestamp)
            .Take(limit)
            .Select(l => new AccessLogDto(
                l.Id,
                l.Timestamp,
                l.IpAddress,
                l.Username,
                l.Success,
                l.FailureReason,
                l.UserAgent
            ))
            .ToListAsync();

        return Ok(logs);
    }
}
