using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class RoutingDataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ReCoffeeDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("RoutingDataSeeder");

        logger.LogInformation("Iniciando Seeder de Rutas Estándar de Producción...");

        var ptItem = await context.Items.FirstOrDefaultAsync(i => i.Code == "PT-001");
        if (ptItem == null)
        {
            logger.LogWarning("No se encontró el artículo PT-001 para asociar la ruta estándar. Asegúrese de ejecutar MasterDataSeeder primero.");
            return;
        }

        if (await context.RoutingHeaders.AnyAsync(r => r.Code == "ROUT-PT-001"))
        {
            logger.LogInformation("La ruta estándar ROUT-PT-001 ya se encuentra registrada.");
            return;
        }

        // Definición de las 8 operaciones estándar (RO-1 a RO-8)
        // 121 minutos de trabajo manual + 1920 minutos (32 horas) de proceso pasivo solar en RO-3
        var routing = new RoutingHeader
        {
            Code = "ROUT-PT-001",
            Name = "Ruta de Fabricación Estándar - Abono Orgánico ReCoffee 5kg",
            ItemId = ptItem.Id,
            Version = "v1.0",
            Description = "Ruta estándar secuencial para la transformación de borra de café en abono orgánico terminado de 5kg.",
            IsActive = true,
            TotalLaborMinutes = 121.0m,
            TotalMachineMinutes = 0.0m,
            TotalPassiveProcessMinutes = 1920.0m,
            TotalCycleMinutes = 2041.0m, // 121m manual + 1920m pasivo
            CreatedAt = DateTime.UtcNow,
            Operations = new List<RoutingOperation>
            {
                new RoutingOperation
                {
                    OperationCode = "RO-1",
                    SequenceOrder = 1,
                    Name = "Recepción y clasificación",
                    Description = "Verificación y separación de materiales orgánicos recibidos.",
                    WorkCenter = "Almacén MP / Recepción",
                    LaborMinutes = 15.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 0.0m,
                    SetupMinutes = 0.0m,
                    IsQualityCheck = false,
                    RequiresIIoTTelemetry = false,
                    StandardInstructions = "Inspeccionar borra de café y cáscaras orgánicas para descartar impurezas sólidas o materias extrañas."
                },
                new RoutingOperation
                {
                    OperationCode = "RO-2",
                    SequenceOrder = 2,
                    Name = "Preparación de ingredientes",
                    Description = "Distribuir la borra de café y los materiales orgánicos complementarios para el proceso de secado.",
                    WorkCenter = "Área de Preparación",
                    LaborMinutes = 60.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 0.0m,
                    SetupMinutes = 5.0m,
                    IsQualityCheck = false,
                    RequiresIIoTTelemetry = false,
                    StandardInstructions = "Esparcir homogéneamente las materias primas en bandejas o camas de secado para maximizar el área de contacto solar."
                },
                new RoutingOperation
                {
                    OperationCode = "RO-3",
                    SequenceOrder = 3,
                    Name = "Secado al sol",
                    Description = "Extender la borra de café y los demás ingredientes orgánicos para secarlos al sol.",
                    WorkCenter = "Patio de Secado Solar",
                    LaborMinutes = 0.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 1920.0m, // 32 horas de proceso pasivo solar
                    SetupMinutes = 0.0m,
                    IsQualityCheck = false,
                    RequiresIIoTTelemetry = true,
                    StandardInstructions = "Exposición a radiación solar continua. Monitoreo por sensor IIoT hasta alcanzar un nivel de humedad <= 20%."
                },
                new RoutingOperation
                {
                    OperationCode = "RO-4",
                    SequenceOrder = 4,
                    Name = "Mezclado de ingredientes",
                    Description = "Mezclar la borra de café seca con los materiales orgánicos complementarios según la formulación establecida.",
                    WorkCenter = "Área de Mezclado",
                    LaborMinutes = 20.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 0.0m,
                    SetupMinutes = 5.0m,
                    IsQualityCheck = false,
                    RequiresIIoTTelemetry = false,
                    StandardInstructions = "Mezclado homogéneo de la fórmula: 70% borra de café, 10% banano, 10% papa y 10% cáscara de huevo."
                },
                new RoutingOperation
                {
                    OperationCode = "RO-5",
                    SequenceOrder = 5,
                    Name = "Control de calidad",
                    Description = "Verificación visual de textura, color y homogeneidad de la mezcla.",
                    WorkCenter = "Estación de Calidad",
                    LaborMinutes = 10.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 0.0m,
                    SetupMinutes = 0.0m,
                    IsQualityCheck = true,
                    RequiresIIoTTelemetry = false,
                    StandardInstructions = "Muestreo por lote: validar textura granulada fina, color oscuro uniforme y ausencia de humedad residual excesiva."
                },
                new RoutingOperation
                {
                    OperationCode = "RO-6",
                    SequenceOrder = 6,
                    Name = "Empaque",
                    Description = "Pesar y colocar 5 kg de abono en cada bolsa.",
                    WorkCenter = "Área de Empaque",
                    LaborMinutes = 5.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 0.0m,
                    SetupMinutes = 0.0m,
                    IsQualityCheck = false,
                    RequiresIIoTTelemetry = false,
                    StandardInstructions = "Llenado exacto de 5.00 kg netos en bolsa Kraft con válvula (EMP-001)."
                },
                new RoutingOperation
                {
                    OperationCode = "RO-7",
                    SequenceOrder = 7,
                    Name = "Etiquetado",
                    Description = "Colocar la etiqueta con la identificación del producto.",
                    WorkCenter = "Área de Empaque",
                    LaborMinutes = 1.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 0.0m,
                    SetupMinutes = 0.0m,
                    IsQualityCheck = false,
                    RequiresIIoTTelemetry = false,
                    StandardInstructions = "Colocación de etiqueta frontal EMP-002 con fecha, código de lote de producción y precinto de garantía."
                },
                new RoutingOperation
                {
                    OperationCode = "RO-8",
                    SequenceOrder = 8,
                    Name = "Almacenamiento",
                    Description = "Trasladar el producto terminado al inventario correspondiente.",
                    WorkCenter = "Almacén Producto Terminado",
                    LaborMinutes = 10.0m,
                    MachineMinutes = 0.0m,
                    PassiveProcessMinutes = 0.0m,
                    SetupMinutes = 0.0m,
                    IsQualityCheck = false,
                    RequiresIIoTTelemetry = false,
                    StandardInstructions = "Traslado y estiba de bolsas terminadas en ALM-003 (Almacén de Producto Terminado) sobre paletas de madera."
                }
            }
        };

        context.RoutingHeaders.Add(routing);
        await context.SaveChangesAsync();

        logger.LogInformation("Ruta estándar {Code} creada exitosamente con {Count} operaciones. Total manual: {Labor} min, Pasivo solar: {Passive} min.",
            routing.Code, routing.Operations.Count, routing.TotalLaborMinutes, routing.TotalPassiveProcessMinutes);
    }
}
