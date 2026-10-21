using System.Text;
using System.Threading.RateLimiting;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
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

    // Desactivar bloqueo por intentos fallidos temporalmente para pruebas locales
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.Zero;
    options.Lockout.MaxFailedAccessAttempts = 100;
    options.Lockout.AllowedForNewUsers = false;
})
.AddEntityFrameworkStores<ReCoffeeDbContext>()
.AddDefaultTokenProviders();

builder.Services.Configure<IdentityOptions>(options =>
{
    // Desactivar bloqueo por intentos fallidos temporalmente
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.Zero;
    options.Lockout.MaxFailedAccessAttempts = 100;
    options.Lockout.AllowedForNewUsers = false;
});

// 3. Services Injection
builder.Services.AddSingleton<ICryptoService, CryptoService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IBomExplosionService, BomExplosionService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ITraceabilityService, TraceabilityService>();

// 4. Rate Limiting Policy (máximo 5 peticiones por minuto por IP para Login contra fuerza bruta)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login-rate-limit", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});

// 5. JWT Authentication (Soporta Authorization Bearer y Cookie HttpOnly 'recoffee_jwt')
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
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.TryGetValue("recoffee_jwt", out var cookieToken) && !string.IsNullOrEmpty(cookieToken))
            {
                context.Token = cookieToken;
            }
            return Task.CompletedTask;
        }
    };
});

// 6. Authorization, HSTS & Strict CORS with Credentials
builder.Services.AddAuthorization();
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

builder.Services.AddCors(options =>
{
    // CORS Explícito para Frontend con transporte de credenciales (Cookies HttpOnly)
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 7. Controllers
builder.Services.AddControllers();

// 8. Swagger / OpenAPI with JWT Support
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
        Description = "Encabezado de autorización JWT o Cookie HttpOnly. Ejemplo: \"Authorization: Bearer {token}\"",
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

// HSTS Transporte Seguro (Exclusivo para Producción; deshabilitado en Dev para evitar forzado HTTPS en localhost)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// CORS Estricto con Credenciales (Cookies)
app.UseCors("AllowFrontend");

// Limitación de Peticiones (Rate Limiting)
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Base & Health Endpoints
app.MapGet("/", () => Results.Ok(new
{
    status = "healthy",
    service = "ReCoffee Backend .NET 8",
    security = "ASP.NET Core Identity & JWT HttpOnly Cookie & Rate Limiting Enabled"
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

app.MapPost("/api/seed/e2e-case-study", async (IServiceProvider sp, IWebHostEnvironment env) =>
{
    try
    {
        string docsDir = Path.Combine(env.ContentRootPath, "..", "docs", "evidencias");
        if (!Directory.Exists(docsDir))
        {
            Directory.CreateDirectory(docsDir);
        }
        string csvPath = Path.Combine(docsDir, "Kardex_Transaccional.csv");
        await TransactionalE2ESeeder.SeedAsync(sp, csvPath);
        return Results.Ok(new { message = "Seeder Transaccional E2E (40 Bolsas PT-001) y exportación de Kardex CSV completados exitosamente.", csvPath });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al sembrar ciclo E2E: {ex.Message}");
    }
})
.WithName("SeedE2ECaseStudy")
.WithOpenApi();

app.MapGet("/api/inventory/kardex/export-csv", async (ReCoffeeDbContext context, IWebHostEnvironment env) =>
{
    try
    {
        string docsDir = Path.Combine(env.ContentRootPath, "..", "docs", "evidencias");
        if (!Directory.Exists(docsDir))
        {
            Directory.CreateDirectory(docsDir);
        }
        string csvPath = Path.Combine(docsDir, "Kardex_Transaccional.csv");
        await TransactionalE2ESeeder.ExportKardexToCsvAsync(context, csvPath);
        var bytes = await File.ReadAllBytesAsync(csvPath);
        return Results.File(bytes, "text/csv", "Kardex_Transaccional.csv");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al exportar Kardex a CSV: {ex.Message}");
    }
})
.WithName("ExportKardexCsv")
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
