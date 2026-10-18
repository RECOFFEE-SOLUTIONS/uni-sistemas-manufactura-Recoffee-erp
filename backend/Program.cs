using System.Text;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context
builder.Services.AddDbContext<ReCoffeeDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Identity Configuration
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<ReCoffeeDbContext>()
.AddDefaultTokenProviders();

// 3. Services Injection
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IBomExplosionService, BomExplosionService>();

// 4. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyForReCoffeeERPAndMES2026ProjectMustBeLongEnough!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ReCoffeeAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ReCoffeeApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// 5. Authorization & CORS
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 6. Controllers
builder.Services.AddControllers();

// 7. Swagger / OpenAPI with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ReCoffee Solutions - ERP & MES API",
        Version = "v1",
        Description = "API del Sistema de Manufactura y Gestión ERP/MES para ReCoffee Solutions"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Encabezado de autorización JWT usando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Base & Health Endpoints
app.MapGet("/", () => Results.Ok(new
{
    status = "healthy",
    service = "ReCoffee Backend .NET 8",
    security = "ASP.NET Core Identity & JWT Enabled"
}))
.WithName("RootHealthCheck")
.WithOpenApi();

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow
}))
.WithName("HealthCheck")
.WithOpenApi();

// Endpoints manuales de inicialización de seeders
app.MapPost("/api/seed/identity", async (IServiceProvider sp) =>
{
    try
    {
        await IdentityDataSeeder.SeedAsync(sp);
        return Results.Ok(new { message = "Seeder de Identity y Roles ejecutado exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al sembrar Identity: {ex.Message}");
    }
})
.WithName("SeedIdentity")
.WithOpenApi();

app.MapPost("/api/seed/master-data", async (IServiceProvider sp) =>
{
    try
    {
        await MasterDataSeeder.SeedAsync(sp);
        return Results.Ok(new { message = "Seeder de Datos Maestros (Almacenes, Artículos, Proveedores, Clientes) ejecutado exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al sembrar Datos Maestros: {ex.Message}");
    }
})
.WithName("SeedMasterData")
.WithOpenApi();

app.MapPost("/api/seed/bom", async (IServiceProvider sp) =>
{
    try
    {
        await BomDataSeeder.SeedAsync(sp);
        return Results.Ok(new { message = "Seeder de Lista de Materiales (BOM Nivel 1 y Nivel 0) ejecutado exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al sembrar BOM: {ex.Message}");
    }
})
.WithName("SeedBom")
.WithOpenApi();

app.MapPost("/api/seed/routings", async (IServiceProvider sp) =>
{
    try
    {
        await RoutingDataSeeder.SeedAsync(sp);
        return Results.Ok(new { message = "Seeder de Rutas Estándar (RO-1 a RO-8) ejecutado exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al sembrar Rutas: {ex.Message}");
    }
})
.WithName("SeedRoutings")
.WithOpenApi();

app.MapPost("/api/seed/purchases", async (IServiceProvider sp) =>
{
    try
    {
        await PurchasingDataSeeder.SeedAsync(sp);
        return Results.Ok(new { message = "Seeder de Compras e Inventario Inicial ejecutado exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al sembrar Compras: {ex.Message}");
    }
})
.WithName("SeedPurchases")
.WithOpenApi();

app.MapPost("/api/seed/all", async (IServiceProvider sp) =>
{
    try
    {
        await IdentityDataSeeder.SeedAsync(sp);
        await MasterDataSeeder.SeedAsync(sp);
        await BomDataSeeder.SeedAsync(sp);
        await RoutingDataSeeder.SeedAsync(sp);
        await PurchasingDataSeeder.SeedAsync(sp);
        return Results.Ok(new { message = "Todos los seeders oficiales (Identity + Datos Maestros + BOM + Rutas + Compras/Inventario) ejecutados exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al sembrar datos: {ex.Message}");
    }
})
.WithName("SeedAll")
.WithOpenApi();

app.MapControllers();

// Auto-migration and seeder execution on startup if DB is accessible
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<ReCoffeeDbContext>();
        logger.LogInformation("Verificando conexión con PostgreSQL y aplicando migraciones pendientes...");
        if (db.Database.CanConnect())
        {
            db.Database.Migrate();
            IdentityDataSeeder.SeedAsync(services).GetAwaiter().GetResult();
            MasterDataSeeder.SeedAsync(services).GetAwaiter().GetResult();
            BomDataSeeder.SeedAsync(services).GetAwaiter().GetResult();
            RoutingDataSeeder.SeedAsync(services).GetAwaiter().GetResult();
            PurchasingDataSeeder.SeedAsync(services).GetAwaiter().GetResult();
            logger.LogInformation("Migraciones, Seeder de Identity, Datos Maestros, BOM, Rutas y Compras ejecutados satisfactoriamente.");
        }
        else
        {
            logger.LogWarning("No se pudo conectar a la base de datos en el inicio. Las migraciones se aplicarán cuando la BD esté lista.");
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning("Excepción durante la verificación inicial de BD (esperada si el contenedor aún está iniciando): {Message}", ex.Message);
    }
}

app.Run();
