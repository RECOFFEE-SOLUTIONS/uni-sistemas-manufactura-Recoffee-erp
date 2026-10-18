using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace backend.Data;

public static class TransactionalE2ESeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider, string? exportCsvPath = null)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ReCoffeeDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("TransactionalE2ESeeder");

        logger.LogInformation("============================================================");
        logger.LogInformation("Iniciando Seeder Transaccional E2E: Caso de Estudio (40 Bolsas PT-001)...");
        logger.LogInformation("============================================================");

        // 1. Obtener Entidades Maestras
        var almMp = await context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-001");
        var almWip = await context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-002");
        var almPt = await context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-003");
        var almEmp = await context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-004");

        var mp001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-001");
        var mp002 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-002");
        var mp003 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-003");
        var mp004 = await context.Items.FirstOrDefaultAsync(i => i.Code == "MP-004");
        var emp001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "EMP-001");
        var emp002 = await context.Items.FirstOrDefaultAsync(i => i.Code == "EMP-002");
        var sem001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "SEM-001");
        var pt001 = await context.Items.FirstOrDefaultAsync(i => i.Code == "PT-001");

        var prov001 = await context.Suppliers.FirstOrDefaultAsync(s => s.Code == "PROV-001");
        var prov002 = await context.Suppliers.FirstOrDefaultAsync(s => s.Code == "PROV-002");
        var prov004 = await context.Suppliers.FirstOrDefaultAsync(s => s.Code == "PROV-004");

        var cli001 = await context.Customers.FirstOrDefaultAsync(c => c.Code == "CLI-001");
        var cli002 = await context.Customers.FirstOrDefaultAsync(c => c.Code == "CLI-002");

        var bomPt = await context.BomHeaders.FirstOrDefaultAsync(b => b.ParentItemId == (pt001 != null ? pt001.Id : 0) && b.IsActive);
        var routingPt = await context.RoutingHeaders.FirstOrDefaultAsync(r => r.ItemId == (pt001 != null ? pt001.Id : 0) && r.IsActive);

        if (almMp == null || almWip == null || almPt == null || almEmp == null ||
            mp001 == null || mp002 == null || mp003 == null || mp004 == null ||
            emp001 == null || emp002 == null || pt001 == null ||
            prov001 == null || prov002 == null || prov004 == null ||
            cli001 == null || cli002 == null)
        {
            logger.LogError("Faltan datos maestros indispensables para ejecutar el ciclo transaccional E2E.");
            return;
        }

        DateTime baseDate = DateTime.UtcNow.AddDays(-3);

        // =========================================================================
        // ETAPA 1: ÓRDENES DE COMPRA Y RECEPCIÓN FÍSICA PARA 40 BOLSAS
        // Consumo requerido por BOM:
        // - MP-001: 140 kg (compramos 200 kg)
        // - MP-002: 20 kg (compramos 50 kg)
        // - MP-003: 20 kg (compramos 50 kg)
        // - MP-004: 20 kg (compramos 50 kg)
        // - EMP-001: 40 unidades (compramos 100 unidades)
        // - EMP-002: 40 unidades (compramos 100 unidades)
        // =========================================================================

        // 1.1 OC-E2E-0001 (PROV-001: Borra de Café)
        if (!await context.PurchaseOrders.AnyAsync(o => o.OrderNumber == "OC-E2E-0001"))
        {
            var oc1 = new PurchaseOrder
            {
                OrderNumber = "OC-E2E-0001",
                SupplierId = prov001.Id,
                OrderDate = baseDate,
                ExpectedDeliveryDate = baseDate.AddDays(1),
                ReceivedDate = baseDate.AddDays(1),
                Status = "Recibida",
                TotalAmount = 2000.00m,
                Notes = "Abastecimiento de borra de café para lote productivo de 40 bolsas.",
                CreatedAt = baseDate,
                Lines = new List<PurchaseOrderLine>
                {
                    new PurchaseOrderLine
                    {
                        ItemId = mp001.Id,
                        Quantity = 200.0m,
                        UnitPrice = mp001.Cost,
                        Subtotal = 200.0m * mp001.Cost,
                        UnitOfMeasure = "kg",
                        ReceivedQuantity = 200.0m,
                        IsReceived = true,
                        GeneratedLotNumber = "LOTE-MP-001-E2E-01"
                    }
                }
            };
            context.PurchaseOrders.Add(oc1);
            await context.SaveChangesAsync();

            // Acreditar inventario físico y Kardex
            await RegisterStockEntry(context, almMp.Id, mp001.Id, "LOTE-MP-001-E2E-01", 200.0m, mp001.Cost,
                baseDate.AddDays(1), "ENTRADA_COMPRA", "OC-E2E-0001",
                "Recepción de 200 kg de borra de café (MP-001) desde PROV-001.", "Módulo de Compras");
        }

        // 1.2 OC-E2E-0002 (PROV-002: Desechos Orgánicos Banano, Papa, Huevo)
        if (!await context.PurchaseOrders.AnyAsync(o => o.OrderNumber == "OC-E2E-0002"))
        {
            var oc2 = new PurchaseOrder
            {
                OrderNumber = "OC-E2E-0002",
                SupplierId = prov002.Id,
                OrderDate = baseDate,
                ExpectedDeliveryDate = baseDate.AddDays(1),
                ReceivedDate = baseDate.AddDays(1),
                Status = "Recibida",
                TotalAmount = (50.0m * mp002.Cost) + (50.0m * mp003.Cost) + (50.0m * mp004.Cost),
                Notes = "Abastecimiento de cáscaras orgánicas clasificadas para subensamble compostable.",
                CreatedAt = baseDate,
                Lines = new List<PurchaseOrderLine>
                {
                    new PurchaseOrderLine
                    {
                        ItemId = mp002.Id,
                        Quantity = 50.0m,
                        UnitPrice = mp002.Cost,
                        Subtotal = 50.0m * mp002.Cost,
                        UnitOfMeasure = "kg",
                        ReceivedQuantity = 50.0m,
                        IsReceived = true,
                        GeneratedLotNumber = "LOTE-MP-002-E2E-01"
                    },
                    new PurchaseOrderLine
                    {
                        ItemId = mp003.Id,
                        Quantity = 50.0m,
                        UnitPrice = mp003.Cost,
                        Subtotal = 50.0m * mp003.Cost,
                        UnitOfMeasure = "kg",
                        ReceivedQuantity = 50.0m,
                        IsReceived = true,
                        GeneratedLotNumber = "LOTE-MP-003-E2E-01"
                    },
                    new PurchaseOrderLine
                    {
                        ItemId = mp004.Id,
                        Quantity = 50.0m,
                        UnitPrice = mp004.Cost,
                        Subtotal = 50.0m * mp004.Cost,
                        UnitOfMeasure = "kg",
                        ReceivedQuantity = 50.0m,
                        IsReceived = true,
                        GeneratedLotNumber = "LOTE-MP-004-E2E-01"
                    }
                }
            };
            context.PurchaseOrders.Add(oc2);
            await context.SaveChangesAsync();

            await RegisterStockEntry(context, almMp.Id, mp002.Id, "LOTE-MP-002-E2E-01", 50.0m, mp002.Cost,
                baseDate.AddDays(1), "ENTRADA_COMPRA", "OC-E2E-0002",
                "Recepción de 50 kg cáscara de banano (MP-002).", "Módulo de Compras");
            await RegisterStockEntry(context, almMp.Id, mp003.Id, "LOTE-MP-003-E2E-01", 50.0m, mp003.Cost,
                baseDate.AddDays(1), "ENTRADA_COMPRA", "OC-E2E-0002",
                "Recepción de 50 kg cáscara de papa (MP-003).", "Módulo de Compras");
            await RegisterStockEntry(context, almMp.Id, mp004.Id, "LOTE-MP-004-E2E-01", 50.0m, mp004.Cost,
                baseDate.AddDays(1), "ENTRADA_COMPRA", "OC-E2E-0002",
                "Recepción de 50 kg cáscara de huevo (MP-004).", "Módulo de Compras");
        }

        // 1.3 OC-E2E-0003 (PROV-004: Insumos de Empaque)
        if (!await context.PurchaseOrders.AnyAsync(o => o.OrderNumber == "OC-E2E-0003"))
        {
            var oc3 = new PurchaseOrder
            {
                OrderNumber = "OC-E2E-0003",
                SupplierId = prov004.Id,
                OrderDate = baseDate,
                ExpectedDeliveryDate = baseDate.AddDays(1),
                ReceivedDate = baseDate.AddDays(1),
                Status = "Recibida",
                TotalAmount = (100.0m * emp001.Cost) + (100.0m * emp002.Cost),
                Notes = "Abastecimiento de bolsas kraft y etiquetas identificadoras de 5kg.",
                CreatedAt = baseDate,
                Lines = new List<PurchaseOrderLine>
                {
                    new PurchaseOrderLine
                    {
                        ItemId = emp001.Id,
                        Quantity = 100.0m,
                        UnitPrice = emp001.Cost,
                        Subtotal = 100.0m * emp001.Cost,
                        UnitOfMeasure = "und",
                        ReceivedQuantity = 100.0m,
                        IsReceived = true,
                        GeneratedLotNumber = "LOTE-EMP-001-E2E-01"
                    },
                    new PurchaseOrderLine
                    {
                        ItemId = emp002.Id,
                        Quantity = 100.0m,
                        UnitPrice = emp002.Cost,
                        Subtotal = 100.0m * emp002.Cost,
                        UnitOfMeasure = "und",
                        ReceivedQuantity = 100.0m,
                        IsReceived = true,
                        GeneratedLotNumber = "LOTE-EMP-002-E2E-01"
                    }
                }
            };
            context.PurchaseOrders.Add(oc3);
            await context.SaveChangesAsync();

            await RegisterStockEntry(context, almEmp.Id, emp001.Id, "LOTE-EMP-001-E2E-01", 100.0m, emp001.Cost,
                baseDate.AddDays(1), "ENTRADA_COMPRA", "OC-E2E-0003",
                "Recepción de 100 bolsas kraft biodegradables (EMP-001) en ALM-004.", "Módulo de Compras");
            await RegisterStockEntry(context, almEmp.Id, emp002.Id, "LOTE-EMP-002-E2E-01", 100.0m, emp002.Cost,
                baseDate.AddDays(1), "ENTRADA_COMPRA", "OC-E2E-0003",
                "Recepción de 100 etiquetas identificadoras ReCoffee (EMP-002) en ALM-004.", "Módulo de Compras");
        }

        // =========================================================================
        // ETAPA 2: ORDEN DE PRODUCCIÓN OP-E2E-0040 (FABRICACIÓN DE 40 BOLSAS PT-001)
        // Consumo exacto por BOM:
        // - MP-001: 140 kg
        // - MP-002: 20 kg
        // - MP-003: 20 kg
        // - MP-004: 20 kg
        // - EMP-001: 40 und
        // - EMP-002: 40 und
        // Entrada a ALM-003: 40 bolsas de PT-001 (LOTE-PT-001-E2E-001)
        // =========================================================================
        string opNumber = "OP-E2E-0040";
        string ptLotNumber = "LOTE-PT-001-E2E-001";
        DateTime opStartDate = baseDate.AddDays(1).AddHours(2);
        DateTime opCompleteDate = baseDate.AddDays(2).AddHours(4);

        if (!await context.ProductionOrders.AnyAsync(o => o.OrderNumber == opNumber))
        {
            decimal totalMatCost =
                (140.0m * mp001.Cost) +
                (20.0m * mp002.Cost) +
                (20.0m * mp003.Cost) +
                (20.0m * mp004.Cost) +
                (40.0m * emp001.Cost) +
                (40.0m * emp002.Cost);

            var op = new ProductionOrder
            {
                OrderNumber = opNumber,
                ItemId = pt001.Id,
                BomHeaderId = bomPt?.Id ?? 1,
                RoutingHeaderId = routingPt?.Id,
                PlannedQuantity = 40.0m,
                ProducedQuantity = 40.0m,
                ScrapQuantity = 0.0m,
                UnitOfMeasure = "bolsa",
                PlannedStartDate = opStartDate,
                PlannedEndDate = opCompleteDate,
                ActualStartDate = opStartDate,
                ActualEndDate = opCompleteDate,
                Status = "Completada",
                Notes = "Caso de estudio E2E Hito M3: Manufactura completa de lote comercial de 40 bolsas de abono orgánico.",
                LotNumber = ptLotNumber,
                TotalEstimatedCost = totalMatCost,
                TotalActualCost = totalMatCost,
                CreatedAt = opStartDate,
                Materials = new List<ProductionOrderMaterial>
                {
                    new ProductionOrderMaterial
                    {
                        ItemId = mp001.Id,
                        RequiredQuantity = 140.0m,
                        ConsumedQuantity = 140.0m,
                        UnitOfMeasure = "kg",
                        UnitCost = mp001.Cost,
                        TotalCost = 140.0m * mp001.Cost,
                        SourceWarehouseId = almMp.Id,
                        WipWarehouseId = almWip.Id,
                        LotNumber = "LOTE-MP-001-E2E-01",
                        IsConsumed = true
                    },
                    new ProductionOrderMaterial
                    {
                        ItemId = mp002.Id,
                        RequiredQuantity = 20.0m,
                        ConsumedQuantity = 20.0m,
                        UnitOfMeasure = "kg",
                        UnitCost = mp002.Cost,
                        TotalCost = 20.0m * mp002.Cost,
                        SourceWarehouseId = almMp.Id,
                        WipWarehouseId = almWip.Id,
                        LotNumber = "LOTE-MP-002-E2E-01",
                        IsConsumed = true
                    },
                    new ProductionOrderMaterial
                    {
                        ItemId = mp003.Id,
                        RequiredQuantity = 20.0m,
                        ConsumedQuantity = 20.0m,
                        UnitOfMeasure = "kg",
                        UnitCost = mp003.Cost,
                        TotalCost = 20.0m * mp003.Cost,
                        SourceWarehouseId = almMp.Id,
                        WipWarehouseId = almWip.Id,
                        LotNumber = "LOTE-MP-003-E2E-01",
                        IsConsumed = true
                    },
                    new ProductionOrderMaterial
                    {
                        ItemId = mp004.Id,
                        RequiredQuantity = 20.0m,
                        ConsumedQuantity = 20.0m,
                        UnitOfMeasure = "kg",
                        UnitCost = mp004.Cost,
                        TotalCost = 20.0m * mp004.Cost,
                        SourceWarehouseId = almMp.Id,
                        WipWarehouseId = almWip.Id,
                        LotNumber = "LOTE-MP-004-E2E-01",
                        IsConsumed = true
                    },
                    new ProductionOrderMaterial
                    {
                        ItemId = emp001.Id,
                        RequiredQuantity = 40.0m,
                        ConsumedQuantity = 40.0m,
                        UnitOfMeasure = "und",
                        UnitCost = emp001.Cost,
                        TotalCost = 40.0m * emp001.Cost,
                        SourceWarehouseId = almEmp.Id,
                        WipWarehouseId = almWip.Id,
                        LotNumber = "LOTE-EMP-001-E2E-01",
                        IsConsumed = true
                    },
                    new ProductionOrderMaterial
                    {
                        ItemId = emp002.Id,
                        RequiredQuantity = 40.0m,
                        ConsumedQuantity = 40.0m,
                        UnitOfMeasure = "und",
                        UnitCost = emp002.Cost,
                        TotalCost = 40.0m * emp002.Cost,
                        SourceWarehouseId = almEmp.Id,
                        WipWarehouseId = almWip.Id,
                        LotNumber = "LOTE-EMP-002-E2E-01",
                        IsConsumed = true
                    }
                }
            };

            context.ProductionOrders.Add(op);
            await context.SaveChangesAsync();

            // 2.1 Descontar inventario de ALM-001 y ALM-004 y registrar salidas en Kardex
            await DeductStockAndRegisterKardex(context, almMp.Id, mp001.Id, "LOTE-MP-001-E2E-01", 140.0m, mp001.Cost,
                opStartDate, "SALIDA_PRODUCCION", opNumber, "Consumo de borra de café para fabricación de 40 bolsas en OP-E2E-0040.", "Módulo Producción MES");

            await DeductStockAndRegisterKardex(context, almMp.Id, mp002.Id, "LOTE-MP-002-E2E-01", 20.0m, mp002.Cost,
                opStartDate, "SALIDA_PRODUCCION", opNumber, "Consumo de cáscara de banano para OP-E2E-0040.", "Módulo Producción MES");

            await DeductStockAndRegisterKardex(context, almMp.Id, mp003.Id, "LOTE-MP-003-E2E-01", 20.0m, mp003.Cost,
                opStartDate, "SALIDA_PRODUCCION", opNumber, "Consumo de cáscara de papa para OP-E2E-0040.", "Módulo Producción MES");

            await DeductStockAndRegisterKardex(context, almMp.Id, mp004.Id, "LOTE-MP-004-E2E-01", 20.0m, mp004.Cost,
                opStartDate, "SALIDA_PRODUCCION", opNumber, "Consumo de cáscara de huevo para OP-E2E-0040.", "Módulo Producción MES");

            await DeductStockAndRegisterKardex(context, almEmp.Id, emp001.Id, "LOTE-EMP-001-E2E-01", 40.0m, emp001.Cost,
                opStartDate, "SALIDA_PRODUCCION", opNumber, "Consumo de 40 bolsas kraft para envasado en OP-E2E-0040.", "Módulo Producción MES");

            await DeductStockAndRegisterKardex(context, almEmp.Id, emp002.Id, "LOTE-EMP-002-E2E-01", 40.0m, emp002.Cost,
                opStartDate, "SALIDA_PRODUCCION", opNumber, "Consumo de 40 etiquetas para etiquetado en OP-E2E-0040.", "Módulo Producción MES");

            // 2.2 Registrar Salida de WIP por culminación
            context.InventoryTransactions.Add(new InventoryTransaction
            {
                TransactionDate = opCompleteDate,
                TransactionType = "SALIDA_WIP",
                ItemId = pt001.Id,
                SourceWarehouseId = almWip.Id,
                DestinationWarehouseId = almPt.Id,
                LotNumber = ptLotNumber,
                Quantity = 40.0m,
                UnitCost = Math.Round(totalMatCost / 40.0m, 4),
                TotalCost = totalMatCost,
                ReferenceNumber = opNumber,
                Notes = "Cierre de fabricación de 40 bolsas en planta y baja de Trabajo en Proceso (ALM-002).",
                PerformedBy = "Módulo Producción MES",
                CreatedAt = opCompleteDate
            });

            // 2.3 Entrada simultánea de PT-001 a ALM-003
            decimal unitProdCost = Math.Round(totalMatCost / 40.0m, 4);
            await RegisterStockEntry(context, almPt.Id, pt001.Id, ptLotNumber, 40.0m, unitProdCost,
                opCompleteDate, "ENTRADA_PRODUCCION", opNumber,
                $"Ingreso formal de 40 bolsas de PT-001 a almacén de ventas ALM-003. Lote: {ptLotNumber}.", "Módulo Producción MES");
        }

        // =========================================================================
        // ETAPA 3: ÓRDENES DE VENTA Y DESPACHO FIFO A 2 CLIENTES
        // - Cliente 1 (CLI-001 Vivero El Roble): 25 bolsas de PT-001
        // - Cliente 2 (CLI-002 AgroComercial Norte): 15 bolsas de PT-001
        // Total Despachado: 40 bolsas (consumo total del lote LOTE-PT-001-E2E-001)
        // =========================================================================

        DateTime saleDate = baseDate.AddDays(2).AddHours(8);
        DateTime dispatchDate1 = baseDate.AddDays(2).AddHours(10);
        DateTime dispatchDate2 = baseDate.AddDays(2).AddHours(14);

        // 3.1 OV-E2E-0001 (CLI-001: 25 bolsas)
        if (!await context.SalesOrders.AnyAsync(s => s.OrderNumber == "OV-E2E-0001"))
        {
            decimal unitPrice = pt001.StandardCost > 0 ? pt001.StandardCost : 75.00m;
            var ov1 = new SalesOrder
            {
                OrderNumber = "OV-E2E-0001",
                CustomerId = cli001.Id,
                OrderDate = saleDate,
                DeliveryDate = dispatchDate1,
                DispatchedDate = dispatchDate1,
                Status = "Despachada",
                TotalAmount = 25.0m * unitPrice,
                Notes = "Despacho comercial de 25 bolsas de sustrato compostable para paisajismo.",
                CreatedAt = saleDate,
                Lines = new List<SalesOrderLine>
                {
                    new SalesOrderLine
                    {
                        ItemId = pt001.Id,
                        Quantity = 25.0m,
                        UnitPrice = unitPrice,
                        Subtotal = 25.0m * unitPrice,
                        UnitOfMeasure = "bolsa",
                        DispatchedQuantity = 25.0m,
                        IsDispatched = true,
                        AssignedLotNumber = $"{ptLotNumber} (25.0 bolsa)"
                    }
                }
            };

            context.SalesOrders.Add(ov1);
            await context.SaveChangesAsync();

            // Descontar 25 bolsas de ALM-003 por FIFO y registrar salida de venta en Kardex
            await DeductStockAndRegisterKardex(context, almPt.Id, pt001.Id, ptLotNumber, 25.0m, pt001.Cost,
                dispatchDate1, "SALIDA_VENTA", "OV-E2E-0001",
                $"Despacho por venta a {cli001.Name} ({cli001.Code}) bajo OV-E2E-0001. Lote FIFO: {ptLotNumber}.", "Módulo de Ventas");
        }

        // 3.2 OV-E2E-0002 (CLI-002: 15 bolsas)
        if (!await context.SalesOrders.AnyAsync(s => s.OrderNumber == "OV-E2E-0002"))
        {
            decimal unitPrice = pt001.StandardCost > 0 ? pt001.StandardCost : 75.00m;
            var ov2 = new SalesOrder
            {
                OrderNumber = "OV-E2E-0002",
                CustomerId = cli002.Id,
                OrderDate = saleDate,
                DeliveryDate = dispatchDate2,
                DispatchedDate = dispatchDate2,
                Status = "Despachada",
                TotalAmount = 15.0m * unitPrice,
                Notes = "Despacho comercial de 15 bolsas de sustrato compostable para distribución regional.",
                CreatedAt = saleDate,
                Lines = new List<SalesOrderLine>
                {
                    new SalesOrderLine
                    {
                        ItemId = pt001.Id,
                        Quantity = 15.0m,
                        UnitPrice = unitPrice,
                        Subtotal = 15.0m * unitPrice,
                        UnitOfMeasure = "bolsa",
                        DispatchedQuantity = 15.0m,
                        IsDispatched = true,
                        AssignedLotNumber = $"{ptLotNumber} (15.0 bolsa)"
                    }
                }
            };

            context.SalesOrders.Add(ov2);
            await context.SaveChangesAsync();

            // Descontar las 15 bolsas restantes de ALM-003 por FIFO y registrar salida en Kardex
            await DeductStockAndRegisterKardex(context, almPt.Id, pt001.Id, ptLotNumber, 15.0m, pt001.Cost,
                dispatchDate2, "SALIDA_VENTA", "OV-E2E-0002",
                $"Despacho por venta a {cli002.Name} ({cli002.Code}) bajo OV-E2E-0002. Lote FIFO: {ptLotNumber}.", "Módulo de Ventas");
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Ciclo Transaccional E2E registrado exitosamente en la base de datos.");

        // =========================================================================
        // ETAPA 4: EXPORTACIÓN DEL KARDEX RESULTANTE A CSV
        // =========================================================================
        if (!string.IsNullOrEmpty(exportCsvPath))
        {
            await ExportKardexToCsvAsync(context, exportCsvPath, logger);
        }
    }

    private static async Task RegisterStockEntry(
        ReCoffeeDbContext context,
        int warehouseId,
        int itemId,
        string lotNumber,
        decimal quantity,
        decimal unitCost,
        DateTime date,
        string txType,
        string reference,
        string notes,
        string performedBy)
    {
        // 1. Stock Físico
        var stock = await context.InventoryStocks
            .FirstOrDefaultAsync(s => s.WarehouseId == warehouseId && s.ItemId == itemId && s.LotNumber == lotNumber);

        if (stock == null)
        {
            stock = new InventoryStock
            {
                WarehouseId = warehouseId,
                ItemId = itemId,
                LotNumber = lotNumber,
                Quantity = quantity,
                LastUpdated = date
            };
            context.InventoryStocks.Add(stock);
        }
        else
        {
            stock.Quantity += quantity;
            stock.LastUpdated = date;
        }

        // 2. Lote Trazable
        var lot = await context.InventoryLots
            .FirstOrDefaultAsync(l => l.LotNumber == lotNumber && l.ItemId == itemId);

        if (lot == null)
        {
            lot = new InventoryLot
            {
                LotNumber = lotNumber,
                ItemId = itemId,
                WarehouseId = warehouseId,
                InitialQuantity = quantity,
                CurrentQuantity = quantity,
                EntryDate = date,
                Status = "Disponible",
                Notes = notes,
                CreatedAt = date
            };
            context.InventoryLots.Add(lot);
        }
        else
        {
            lot.CurrentQuantity += quantity;
            lot.Status = "Disponible";
        }

        // 3. Kardex Inmutable
        var tx = new InventoryTransaction
        {
            TransactionDate = date,
            TransactionType = txType,
            ItemId = itemId,
            SourceWarehouseId = null,
            DestinationWarehouseId = warehouseId,
            LotNumber = lotNumber,
            Quantity = quantity,
            UnitCost = unitCost,
            TotalCost = Math.Round(quantity * unitCost, 2),
            ReferenceNumber = reference,
            Notes = notes,
            PerformedBy = performedBy,
            CreatedAt = date
        };
        context.InventoryTransactions.Add(tx);
        await context.SaveChangesAsync();
    }

    private static async Task DeductStockAndRegisterKardex(
        ReCoffeeDbContext context,
        int warehouseId,
        int itemId,
        string lotNumber,
        decimal quantity,
        decimal unitCost,
        DateTime date,
        string txType,
        string reference,
        string notes,
        string performedBy)
    {
        // 1. Descontar Stock Físico
        var stock = await context.InventoryStocks
            .FirstOrDefaultAsync(s => s.WarehouseId == warehouseId && s.ItemId == itemId && s.LotNumber == lotNumber);

        if (stock != null)
        {
            stock.Quantity = Math.Max(0m, stock.Quantity - quantity);
            stock.LastUpdated = date;
        }

        // 2. Descontar Lote Trazable
        var lot = await context.InventoryLots
            .FirstOrDefaultAsync(l => l.LotNumber == lotNumber && l.ItemId == itemId);

        if (lot != null)
        {
            lot.CurrentQuantity = Math.Max(0m, lot.CurrentQuantity - quantity);
            if (lot.CurrentQuantity == 0)
            {
                lot.Status = "Agotado";
            }
        }

        // 3. Kardex Inmutable
        var tx = new InventoryTransaction
        {
            TransactionDate = date,
            TransactionType = txType,
            ItemId = itemId,
            SourceWarehouseId = warehouseId,
            DestinationWarehouseId = null,
            LotNumber = lotNumber,
            Quantity = quantity,
            UnitCost = unitCost,
            TotalCost = Math.Round(quantity * unitCost, 2),
            ReferenceNumber = reference,
            Notes = notes,
            PerformedBy = performedBy,
            CreatedAt = date
        };
        context.InventoryTransactions.Add(tx);
        await context.SaveChangesAsync();
    }

    public static async Task ExportKardexToCsvAsync(ReCoffeeDbContext context, string filePath, ILogger? logger = null)
    {
        var dir = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }

        var transactions = await context.InventoryTransactions
            .Include(t => t.Item)
            .Include(t => t.SourceWarehouse)
            .Include(t => t.DestinationWarehouse)
            .OrderBy(t => t.TransactionDate)
            .ThenBy(t => t.Id)
            .ToListAsync();

        var sb = new StringBuilder();
        // Encabezado CSV
        sb.AppendLine("ID_Transaccion,Fecha,Tipo_Operacion,Codigo_Articulo,Nombre_Articulo,Almacen_Origen,Almacen_Destino,Lote,Cantidad,Costo_Unitario_C$,Costo_Total_C$,Referencia,Observaciones,Responsable");

        foreach (var t in transactions)
        {
            string dateStr = t.TransactionDate.ToString("yyyy-MM-dd HH:mm:ss");
            string itemCode = t.Item?.Code ?? "N/A";
            string itemName = EscapeCsv(t.Item?.Name ?? "N/A");
            string srcWh = t.SourceWarehouse?.Code ?? "—";
            string dstWh = t.DestinationWarehouse?.Code ?? "—";
            string lot = t.LotNumber ?? "Sin Lote";
            string qty = t.Quantity.ToString("F2");
            string unitCost = t.UnitCost.ToString("F2");
            string totalCost = t.TotalCost.ToString("F2");
            string reference = EscapeCsv(t.ReferenceNumber ?? "N/A");
            string notes = EscapeCsv(t.Notes ?? "");
            string performedBy = EscapeCsv(t.PerformedBy ?? "Sistema");

            sb.AppendLine($"{t.Id},{dateStr},{t.TransactionType},{itemCode},{itemName},{srcWh},{dstWh},{lot},{qty},{unitCost},{totalCost},{reference},{notes},{performedBy}");
        }

        await File.WriteAllTextAsync(filePath, sb.ToString(), Encoding.UTF8);
        logger?.LogInformation("Kardex exportado exitosamente a CSV en: {Path} con {Count} registros.", filePath, transactions.Count);
    }

    private static string EscapeCsv(string field)
    {
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }
}
