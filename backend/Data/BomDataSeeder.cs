using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class BomDataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ReCoffeeDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("BomDataSeeder");

        logger.LogInformation("Iniciando Seeder de Lista de Materiales (BOM Multinivel)...");

        var semItem = await context.Items.FirstOrDefaultAsync(i => i.Code == "SEM-001");
        var ptItem = await context.Items.FirstOrDefaultAsync(i => i.Code == "PT-001");
        var mp001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-001");
        var mp002 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-002");
        var mp003 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-003");
        var mp004 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-004");
        var emp001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "EMP-001");
        var emp002 = await context.Items.FirstOrDefaultAsync(i => i.Code == "EMP-002");

        if (semItem == null || ptItem == null || mp001 == null || mp002 == null || mp003 == null || mp004 == null || emp001 == null || emp002 == null)
        {
            logger.LogWarning("No se encontraron todos los artículos necesarios para sembrar el BOM. Asegúrese de ejecutar MasterDataSeeder primero.");
            return;
        }

        // 1. BOM Nivel 1: Subensamble SEM-001 (base 5kg)
        // Consume MP-001 (3.5kg), MP-002 (0.5kg), MP-003 (0.5kg), MP-004 (0.5kg)
        if (!await context.BomHeaders.AnyAsync(b => b.Code == "BOM-SEM-001"))
        {
            var bomSem = new BomHeader
            {
                Code = "BOM-SEM-001",
                ParentItemId = semItem.Id,
                Version = "v1.0",
                Description = "Receta Estándar Subensamble Mezcla Base Harina de Café 5kg (BOM Nivel 1)",
                BaseQuantity = 5.0m,
                UnitOfMeasure = "kg",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Components = new List<BomComponent>
                {
                    new BomComponent
                    {
                        ComponentItemId = mp001.Id,
                        Quantity = 3.5m,
                        UnitOfMeasure = "kg",
                        ScrapPercentage = 0.0m,
                        Level = 1,
                        Notes = "Pulpa y broza de café (70%)"
                    },
                    new BomComponent
                    {
                        ComponentItemId = mp002.Id,
                        Quantity = 0.5m,
                        UnitOfMeasure = "kg",
                        ScrapPercentage = 0.0m,
                        Level = 1,
                        Notes = "Cáscara de banano deshidratada (10%)"
                    },
                    new BomComponent
                    {
                        ComponentItemId = mp003.Id,
                        Quantity = 0.5m,
                        UnitOfMeasure = "kg",
                        ScrapPercentage = 0.0m,
                        Level = 1,
                        Notes = "Cáscara de papa seca (10%)"
                    },
                    new BomComponent
                    {
                        ComponentItemId = mp004.Id,
                        Quantity = 0.5m,
                        UnitOfMeasure = "kg",
                        ScrapPercentage = 0.0m,
                        Level = 1,
                        Notes = "Cáscara de huevo triturada (10%)"
                    }
                }
            };

            context.BomHeaders.Add(bomSem);
            logger.LogInformation("Sembrando BOM Nivel 1: {Code} para {Item}", bomSem.Code, semItem.Code);
        }

        // 2. BOM Nivel 0: Producto terminado PT-001 (1 bolsa)
        // Consume SEM-001 (5kg) y los insumos de empaque EMP-001 (1 unidad) y EMP-002 (1 unidad)
        if (!await context.BomHeaders.AnyAsync(b => b.Code == "BOM-PT-001"))
        {
            var bomPt = new BomHeader
            {
                Code = "BOM-PT-001",
                ParentItemId = ptItem.Id,
                Version = "v1.0",
                Description = "Receta de Ensacado y Empaque de Abono Orgánico ReCoffee 5kg (BOM Nivel 0)",
                BaseQuantity = 1.0m,
                UnitOfMeasure = "bolsa",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Components = new List<BomComponent>
                {
                    new BomComponent
                    {
                        ComponentItemId = semItem.Id,
                        Quantity = 5.0m,
                        UnitOfMeasure = "kg",
                        ScrapPercentage = 0.0m,
                        Level = 0,
                        Notes = "Subensamble de mezcla base formulada y secada"
                    },
                    new BomComponent
                    {
                        ComponentItemId = emp001.Id,
                        Quantity = 1.0m,
                        UnitOfMeasure = "bolsa",
                        ScrapPercentage = 0.0m,
                        Level = 0,
                        Notes = "Saco Kraft biodegradable tricapa de 5kg"
                    },
                    new BomComponent
                    {
                        ComponentItemId = emp002.Id,
                        Quantity = 1.0m,
                        UnitOfMeasure = "unidad",
                        ScrapPercentage = 0.0m,
                        Level = 0,
                        Notes = "Etiqueta técnica frontal y precinto de sellado"
                    }
                }
            };

            context.BomHeaders.Add(bomPt);
            logger.LogInformation("Sembrando BOM Nivel 0: {Code} para {Item}", bomPt.Code, ptItem.Code);
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Seeder de BOM Multinivel completado exitosamente.");
    }
}
