using Microsoft.AspNetCore.Identity;

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
        new SeedUser("davis", "davis@recoffee.com", "Admin", "Davis Muñoz"),
        new SeedUser("melany", "melany@recoffee.com", "Admin", "Melany Sánchez"),
        new SeedUser("kenneth", "kenneth@recoffee.com", "Almacen", "Kenneth Pérez"),
        new SeedUser("wildor", "wildor@recoffee.com", "Produccion", "Wildor Jarquín"),
        new SeedUser("dayana", "dayana@recoffee.com", "Calidad", "Dayana Reyes"),
        new SeedUser("dayerling", "dayerling@recoffee.com", "Ventas", "Dayerling Perez")
    };

    public const string DefaultPassword = "Password123!";

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
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

        logger.LogInformation("Verificando y sembrando usuarios de ReCoffee Solutions...");
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
                    logger.LogInformation("Usuario {Username} ({FullName}) creado exitosamente.", u.Username, u.FullName);
                    await userManager.AddToRoleAsync(user, u.Role);
                    logger.LogInformation("Usuario {Username} asignado al rol {Role}.", u.Username, u.Role);
                }
                else
                {
                    logger.LogError("Error al crear usuario {Username}: {Errors}", u.Username, string.Join(", ", createResult.Errors.Select(e => e.Description)));
                }
            }
        }
    }
}
