using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class PurchasingDataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ReCoffeeDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("PurchasingDataSeeder");

        logger.LogInformation("Iniciando Seeder de Compras e Inventario Inicial...");

        var prov001 = await context.Suppliers.FirstOrDefaultAsync(s => s.Code == "PROV-001");
        var prov002 = await context.Suppliers.FirstOrDefaultAsync(s => s.Code == "PROV-002");
        var prov004 = await context.Suppliers.FirstOrDefaultAsync(s => s.Code == "PROV-004");

        var mp001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-001");
        var mp002 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-002");
        var mp003 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-003");
        var mp004 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-004");
        var emp001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "EMP-001");
        var emp002 = await context.Items.FirstOrDefaultAsync(i => i.Code == "EMP-002");

        var almMp = await context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-001");
        var almEmp = await context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-004");

        if (prov001 == null || prov004 == null || mp001 == null || emp001 == null || emp002 == null || almMp == null || almEmp == null)
        {
            logger.LogWarning("No se encontraron los datos maestros necesarios para sembrar compras e inventario.");
            return;
        }

        // 1. Orden de Compra Recibida: OC-2026-0001 (Materias Primas)
        if (!await context.PurchaseOrders.AnyAsync(o => o.OrderNumber == "OC-2026-0001"))
        {
            var oc1 = new PurchaseOrder
            {
                OrderNumber = "OC-2026-0001",
                SupplierId = prov001.Id,
                OrderDate = DateTime.UtcNow.AddDays(-5),
                ExpectedDeliveryDate = DateTime.UtcNow.AddDays(-3),
                ReceivedDate = DateTime.UtcNow.AddDays(-3),
                Status = "Recibida",
                TotalAmount = 3500.00m,
                Notes = "Lote piloto inicial de borra de café para arranque de planta.",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                Lines = new List<PurchaseOrderLine>
                {
                    new PurchaseOrderLine
                    {
                        ItemId = mp001.Id,
                        Quantity = 350.0m,
                        UnitPrice = mp001.Cost,
                        Subtotal = 350.0m * mp001.Cost,
                        UnitOfMeasure = "kg",
                        ReceivedQuantity = 350.0m,
                        IsReceived = true,
                        GeneratedLotNumber = "LOTE-MP-001-001"
                    }
                }
            };
            context.PurchaseOrders.Add(oc1);
            await context.SaveChangesAsync();

            // Lote e Inventario para OC-1
            context.InventoryLots.Add(new InventoryLot
            {
                LotNumber = "LOTE-MP-001-001",
                ItemId = mp001.Id,
                WarehouseId = almMp.Id,
                InitialQuantity = 350.0m,
                CurrentQuantity = 350.0m,
                PurchaseOrderId = oc1.Id,
                EntryDate = DateTime.UtcNow.AddDays(-3),
                Status = "Disponible",
                Notes = "Entrada inicial por recepción de OC-2026-0001",
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            });

            var stockMp = await context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == almMp.Id && s.ItemId == mp001.Id && s.LotNumber == "LOTE-MP-001-001");
            if (stockMp == null)
            {
                context.InventoryStocks.Add(new InventoryStock
                {
                    WarehouseId = almMp.Id,
                    ItemId = mp001.Id,
                    LotNumber = "LOTE-MP-001-001",
                    Quantity = 350.0m,
                    LastUpdated = DateTime.UtcNow.AddDays(-3)
                });
            }
            else
            {
                stockMp.Quantity += 350.0m;
            }

            context.InventoryMovements.Add(new InventoryMovement
            {
                MovementDate = DateTime.UtcNow.AddDays(-3),
                MovementType = "RECEPCION_COMPRA",
                ItemId = mp001.Id,
                WarehouseId = almMp.Id,
                LotNumber = "LOTE-MP-001-001",
                Quantity = 350.0m,
                UnitCost = mp001.Cost,
                TotalCost = 350.0m * mp001.Cost,
                ReferenceNumber = "OC-2026-0001",
                Notes = "Recepción inicial de borra de café de cafeterías locales."
            });

            context.InventoryTransactions.Add(new InventoryTransaction
            {
                TransactionDate = DateTime.UtcNow.AddDays(-3),
                TransactionType = "ENTRADA_COMPRA",
                ItemId = mp001.Id,
                DestinationWarehouseId = almMp.Id,
                SourceWarehouseId = null,
                LotNumber = "LOTE-MP-001-001",
                Quantity = 350.0m,
                UnitCost = mp001.Cost,
                TotalCost = 350.0m * mp001.Cost,
                ReferenceNumber = "OC-2026-0001",
                Notes = "Recepción inicial de borra de café de cafeterías locales.",
                PerformedBy = "Sistema / Seeder",
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            });

            await context.SaveChangesAsync();
            logger.LogInformation("OC-2026-0001 sembrada como Recibida con lote e incremento de stock.");
        }

        // 2. Orden de Compra Emitida (Pendiente de Recepción): OC-2026-0002
        if (!await context.PurchaseOrders.AnyAsync(o => o.OrderNumber == "OC-2026-0002"))
        {
            var oc2 = new PurchaseOrder
            {
                OrderNumber = "OC-2026-0002",
                SupplierId = prov004.Id,
                OrderDate = DateTime.UtcNow.AddDays(-1),
                ExpectedDeliveryDate = DateTime.UtcNow.AddDays(2),
                Status = "Emitida",
                TotalAmount = 1750.00m,
                Notes = "Pedido de empaques sostenibles Kraft y precintos de seguridad.",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Lines = new List<PurchaseOrderLine>
                {
                    new PurchaseOrderLine
                    {
                        ItemId = emp001.Id,
                        Quantity = 100.0m,
                        UnitPrice = emp001.Cost,
                        Subtotal = 100.0m * emp001.Cost,
                        UnitOfMeasure = "unidad",
                        ReceivedQuantity = 0.0m,
                        IsReceived = false
                    },
                    new PurchaseOrderLine
                    {
                        ItemId = emp002.Id,
                        Quantity = 100.0m,
                        UnitPrice = emp002.Cost,
                        Subtotal = 100.0m * emp002.Cost,
                        UnitOfMeasure = "unidad",
                        ReceivedQuantity = 0.0m,
                        IsReceived = false
                    }
                }
            };
            context.PurchaseOrders.Add(oc2);
            await context.SaveChangesAsync();
            logger.LogInformation("OC-2026-0002 sembrada como Emitida (lista para recepcionar).");
        }
    }
}
