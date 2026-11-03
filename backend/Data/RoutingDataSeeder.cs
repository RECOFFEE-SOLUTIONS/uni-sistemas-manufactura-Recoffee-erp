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
        var pt2Item = await context.Items.FirstOrDefaultAsync(i => i.Code == "PT-002");

        if (ptItem != null && !await context.RoutingHeaders.AnyAsync(r => r.Code == "ROUT-PT-001"))
        {
            var routing1 = new RoutingHeader
            {
                Code = "ROUT-PT-001",
                Name = "Ruta de Fabricación Estándar - Abono Orgánico ReCoffee Bolsa 5kg",
                ItemId = ptItem.Id,
                Version = "v1.0",
                Description = "Ruta estándar secuencial para la transformación de borra de café en abono orgánico terminado de 5kg.",
                IsActive = true,
                TotalLaborMinutes = 121.0m,
                TotalMachineMinutes = 0.0m,
                TotalPassiveProcessMinutes = 1920.0m,
                TotalCycleMinutes = 2041.0m, // 121m manual + 1920m pasivo
                CreatedAt = DateTime.UtcNow,
                Operations = BuildStandardOperations("5kg")
            };
            context.RoutingHeaders.Add(routing1);
            logger.LogInformation("Ruta estándar {Code} creada exitosamente.", routing1.Code);
        }

        if (pt2Item != null && !await context.RoutingHeaders.AnyAsync(r => r.Code == "ROUT-PT-002"))
        {
            var routing2 = new RoutingHeader
            {
                Code = "ROUT-PT-002",
                Name = "Ruta de Fabricación Estándar - Abono Orgánico ReCoffee Saco 25kg",
                ItemId = pt2Item.Id,
                Version = "v1.0",
                Description = "Ruta estándar secuencial para la transformación y ensacado de abono en saco de 25kg.",
                IsActive = true,
                TotalLaborMinutes = 135.0m,
                TotalMachineMinutes = 0.0m,
                TotalPassiveProcessMinutes = 1920.0m,
                TotalCycleMinutes = 2055.0m,
                CreatedAt = DateTime.UtcNow,
                Operations = BuildStandardOperations("25kg")
            };
            context.RoutingHeaders.Add(routing2);
            logger.LogInformation("Ruta estándar {Code} creada exitosamente.", routing2.Code);
        }

        await context.SaveChangesAsync();
    }

    private static List<RoutingOperation> BuildStandardOperations(string presentation)
    {
        return new List<RoutingOperation>
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
                StandardInstructions = "Revisar pesaje de pulpa fresca MP-001 y clasificar según humedad aparente."
            },
            new RoutingOperation
            {
                OperationCode = "RO-2",
                SequenceOrder = 2,
                Name = "Trituración",
                Description = "Reducción de tamaño de partícula de materia orgánica cruda.",
                WorkCenter = "Área de Trituración y Molienda",
                LaborMinutes = 20.0m,
                MachineMinutes = 0.0m,
                PassiveProcessMinutes = 0.0m,
                SetupMinutes = 5.0m,
                IsQualityCheck = false,
                RequiresIIoTTelemetry = false,
                StandardInstructions = "Procesar cascarilla y residuos en molino de martillos hasta granulometría < 3mm."
            },
            new RoutingOperation
            {
                OperationCode = "RO-3",
                SequenceOrder = 3,
                Name = "Secado solar",
                Description = "Deshidratación en lechos solares hasta alcanzar humedad <= 20%.",
                WorkCenter = "Camas de Secado Solar (RO-3)",
                LaborMinutes = 15.0m,
                MachineMinutes = 0.0m,
                PassiveProcessMinutes = 1920.0m,
                SetupMinutes = 0.0m,
                IsQualityCheck = false,
                RequiresIIoTTelemetry = true,
                StandardInstructions = "Extender capa uniforme de 5cm. Monitorear telemetría de humedad y voltear cada 4 horas de sol."
            },
            new RoutingOperation
            {
                OperationCode = "RO-4",
                SequenceOrder = 4,
                Name = "Mezclado",
                Description = "Homogeneización de materias primas según formulación BOM.",
                WorkCenter = "Área de Mezclado",
                LaborMinutes = 25.0m,
                MachineMinutes = 0.0m,
                PassiveProcessMinutes = 0.0m,
                SetupMinutes = 5.0m,
                IsQualityCheck = false,
                RequiresIIoTTelemetry = false,
                StandardInstructions = "Cargar componentes según receta SEM-001 en mezcladora de cintas helicoidales por 20 minutos."
            },
            new RoutingOperation
            {
                OperationCode = "RO-5",
                SequenceOrder = 5,
                Name = "Control de calidad",
                Description = "Inspección técnica de humedad (15%-25%), pH y granulometría.",
                WorkCenter = "Laboratorio de Calidad",
                LaborMinutes = 15.0m,
                MachineMinutes = 0.0m,
                PassiveProcessMinutes = 0.0m,
                SetupMinutes = 0.0m,
                IsQualityCheck = true,
                RequiresIIoTTelemetry = false,
                StandardInstructions = "Toma de 3 muestras representativas. Si humedad > 25% o < 15%, emitir NCR de retención inmediato."
            },
            new RoutingOperation
            {
                OperationCode = "RO-6",
                SequenceOrder = 6,
                Name = "Envasado",
                Description = $"Dosificación y llenado del producto en empaque ({presentation}).",
                WorkCenter = "Área de Envasado",
                LaborMinutes = 15.0m,
                MachineMinutes = 0.0m,
                PassiveProcessMinutes = 0.0m,
                SetupMinutes = 5.0m,
                IsQualityCheck = false,
                RequiresIIoTTelemetry = false,
                StandardInstructions = $"Dosificar peso neto exacto ({presentation}) en saco kraft y verificar tara de balanza."
            },
            new RoutingOperation
            {
                OperationCode = "RO-7",
                SequenceOrder = 7,
                Name = "Etiquetado",
                Description = "Colocar la etiqueta con la identificación del producto.",
                WorkCenter = "Área de Empaque",
                LaborMinutes = 6.0m,
                MachineMinutes = 0.0m,
                PassiveProcessMinutes = 0.0m,
                SetupMinutes = 0.0m,
                IsQualityCheck = false,
                RequiresIIoTTelemetry = false,
                StandardInstructions = "Colocación de etiqueta frontal con fecha, código de lote de producción y precinto de garantía."
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
                StandardInstructions = "Traslado y estiba en ALM-003 (Almacén de Producto Terminado) sobre paletas de madera."
            }
        };
    }
}