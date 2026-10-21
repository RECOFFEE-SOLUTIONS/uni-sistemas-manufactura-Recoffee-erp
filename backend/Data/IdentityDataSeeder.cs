using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class IdentityDataSeeder
{
    public static readonly string[] Roles = new[]
    {
        "Admin",
        "Produccion",
        "Calidad",
        "Almacen",
        "Ventas"
    };

    public record SeedUser(string Username, string Email, string Role, string FullName);

    public static readonly SeedUser[] InitialUsers = new[]
    {
        new SeedUser("davis", "davis@recoffee.ni", "Admin", "Davis Muñoz"),
        new SeedUser("melany", "melany@recoffee.ni", "Admin", "Melany Sánchez"),
        new SeedUser("kenneth", "kenneth@recoffee.ni", "Almacen", "Kenneth Pérez"),
        new SeedUser("wildor", "wildor@recoffee.ni", "Produccion", "Wildor Jarquín"),
        new SeedUser("dayana", "dayana@recoffee.ni", "Calidad", "Dayana Reyes"),
        new SeedUser("dayerling", "dayerling@recoffee.ni", "Ventas", "Dayerling Perez")
    };

    public const string DefaultPassword = "Password123!";

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var db = scope.ServiceProvider.GetRequiredService<ReCoffeeDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("IdentityDataSeeder");

        logger.LogInformation("Verificando y sembrando roles de sistema...");
        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole(role));
                if (roleResult.Succeeded)
                {
                    logger.LogInformation("Rol creado: {Role}", role);
                }
                else
                {
                    logger.LogError("Error al crear rol {Role}: {Errors}", role, string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                }
            }
        }

        logger.LogInformation("Verificando, actualizando correos a @recoffee.ni y restableciendo contraseñas a {Password}...", DefaultPassword);
        foreach (var u in InitialUsers)
        {
            var user = await userManager.FindByNameAsync(u.Username);
            if (user == null)
            {
                user = new IdentityUser
                {
                    UserName = u.Username,
                    Email = u.Email,
                    EmailConfirmed = true
                };

                var createResult = await userManager.CreateAsync(user, DefaultPassword);
                if (createResult.Succeeded)
                {
                    logger.LogInformation("Usuario {Username} ({FullName}) creado exitosamente con correo {Email}.", u.Username, u.FullName, u.Email);
                    await userManager.AddToRoleAsync(user, u.Role);
                }
                else
                {
                    logger.LogError("Error al crear usuario {Username}: {Errors}", u.Username, string.Join(", ", createResult.Errors.Select(e => e.Description)));
                }
            }
            else
            {
                // Usuario existente en BD: forzar actualización al dominio corporativo @recoffee.ni
                user.Email = u.Email;
                user.EmailConfirmed = true;
                await userManager.UpdateAsync(user);
                await userManager.UpdateNormalizedEmailAsync(user);

                // Forzar restablecimiento de contraseña a Password123!
                var hasPassword = await userManager.HasPasswordAsync(user);
                if (hasPassword)
                {
                    await userManager.RemovePasswordAsync(user);
                }
                await userManager.AddPasswordAsync(user, DefaultPassword);

                // Desbloquear si hubo intentos fallidos previos
                await userManager.SetLockoutEndDateAsync(user, null);
                await userManager.ResetAccessFailedCountAsync(user);

                // Asegurar asignación de rol
                if (!await userManager.IsInRoleAsync(user, u.Role))
                {
                    await userManager.AddToRoleAsync(user, u.Role);
                }

                logger.LogInformation("Usuario existente {Username} actualizado con correo {Email} y contraseña {Password}.", u.Username, u.Email, DefaultPassword);
            }

            // Asegurar que el perfil de seguridad quede habilitado sin forzar cambio inicial
            if (user != null)
            {
                var profile = await db.UserSecurityProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (profile == null)
                {
                    profile = new UserSecurityProfile
                    {
                        UserId = user.Id,
                        MustChangePassword = false,
                        IsTemporaryPassword = false
                    };
                    db.UserSecurityProfiles.Add(profile);
                }
                else
                {
                    profile.MustChangePassword = false;
                    profile.IsTemporaryPassword = false;
                    profile.TemporaryPassword = null;
                }
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Sembrado y actualización de usuarios completado exitosamente.");
    }
}
