using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class TraceabilityService : ITraceabilityService
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<TraceabilityService> _logger;

    public TraceabilityService(ReCoffeeDbContext context, ILogger<TraceabilityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<LotTraceabilityResponseDto?> GetLotTraceabilityAsync(string lotNumber)
    {
        if (string.IsNullOrWhiteSpace(lotNumber)) return null;

        string cleanLot = lotNumber.Trim();

        // 1. Localizar el lote en InventoryLots
        var lot = await _context.InventoryLots
            .Include(l => l.Item)
            .Include(l => l.Warehouse)
            .Include(l => l.PurchaseOrder)
                .ThenInclude(p => p!.Supplier)
            .FirstOrDefaultAsync(l => l.LotNumber == cleanLot);

        // Si no está registrado en InventoryLots, intentar localizarlo en ProductionOrders, Purchases o Transactions
        Item? item = lot?.Item;
        Warehouse? warehouse = lot?.Warehouse;
        DateTime entryDate = lot?.EntryDate ?? DateTime.UtcNow;
        decimal initialQty = lot?.InitialQuantity ?? 0m;
        decimal currentQty = lot?.CurrentQuantity ?? 0m;
        string status = lot?.Status ?? "Registrado";

        ProductionOrder? prodOrder = await _context.ProductionOrders
            .Include(p => p.Item)
            .Include(p => p.Materials)
                .ThenInclude(m => m.Item)
            .Include(p => p.Materials)
                .ThenInclude(m => m.SourceWarehouse)
            .Include(p => p.BomHeader)
            .Include(p => p.RoutingHeader)
            .FirstOrDefaultAsync(p => p.LotNumber == cleanLot);

        if (lot == null)
        {
            if (prodOrder != null)
            {
                item = prodOrder.Item;
                warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-003");
                entryDate = prodOrder.ActualEndDate ?? prodOrder.CreatedAt;
                initialQty = prodOrder.ProducedQuantity > 0 ? prodOrder.ProducedQuantity : prodOrder.PlannedQuantity;
                status = prodOrder.Status == "Completada" ? "Disponible" : prodOrder.Status;

                // Verificar stock actual
                var currentStock = await _context.InventoryStocks
                    .FirstOrDefaultAsync(s => s.LotNumber == cleanLot && s.ItemId == prodOrder.ItemId);
                currentQty = currentStock?.Quantity ?? 0m;
            }
            else
            {
                // Buscar en PurchaseOrderLines
                var poLine = await _context.PurchaseOrderLines
                    .Include(l => l.Item)
                    .Include(l => l.PurchaseOrder)
                        .ThenInclude(p => p!.Supplier)
                    .FirstOrDefaultAsync(l => l.GeneratedLotNumber == cleanLot);

                if (poLine != null)
                {
                    item = poLine.Item;
                    string whCode = item?.Category == "EMP" ? "ALM-004" : "ALM-001";
                    warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == whCode);
                    entryDate = poLine.PurchaseOrder?.ReceivedDate ?? poLine.PurchaseOrder?.OrderDate ?? DateTime.UtcNow;
                    initialQty = poLine.ReceivedQuantity > 0 ? poLine.ReceivedQuantity : poLine.Quantity;
                    var stockEntry = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.LotNumber == cleanLot && s.ItemId == poLine.ItemId);
                    currentQty = stockEntry?.Quantity ?? 0m;
                    status = currentQty > 0 ? "Disponible" : "Agotado";
                }
                else
                {
                    // Buscar en InventoryTransactions
                    var tx = await _context.InventoryTransactions
                        .Include(t => t.Item)
                        .Include(t => t.DestinationWarehouse)
                        .Include(t => t.SourceWarehouse)
                        .OrderBy(t => t.TransactionDate)
                        .FirstOrDefaultAsync(t => t.LotNumber == cleanLot);

                    if (tx != null)
                    {
                        item = tx.Item;
                        warehouse = tx.DestinationWarehouse ?? tx.SourceWarehouse;
                        entryDate = tx.TransactionDate;
                        initialQty = tx.Quantity;
                        var stockEntry = await _context.InventoryStocks.FirstOrDefaultAsync(s => s.LotNumber == cleanLot && s.ItemId == tx.ItemId);
                        currentQty = stockEntry?.Quantity ?? 0m;
                        status = currentQty > 0 ? "Disponible" : "Consumido";
                    }
                    else
                    {
                        // Lote no existe en ninguna tabla
                        _logger.LogWarning("No se encontró registro para el lote: {LotNumber}", cleanLot);
                        return null;
                    }
                }
            }
        }

        string category = item?.Category ?? "PT";
        string lotType = category switch
        {
            "PT" => "Producto Terminado",
            "SEM" => "Subensamble en Proceso",
            "MP" => "Materia Prima",
            "EMP" => "Insumo de Empaque",
            _ => "Material"
        };

        var response = new LotTraceabilityResponseDto
        {
            LotNumber = cleanLot,
            ItemId = item?.Id ?? 0,
            ItemCode = item?.Code ?? string.Empty,
            ItemName = item?.Name ?? string.Empty,
            Category = category,
            WarehouseId = warehouse?.Id,
            WarehouseCode = warehouse?.Code ?? string.Empty,
            WarehouseName = warehouse?.Name ?? string.Empty,
            InitialQuantity = initialQty,
            CurrentQuantity = currentQty,
            UnitOfMeasure = item?.UnitOfMeasure ?? "und",
            EntryDate = entryDate,
            Status = status,
            LotType = lotType
        };

        // =========================================================================
        // TRAZABILIDAD UPSTREAM (HACIA ATRÁS)
        // =========================================================================

        if (prodOrder != null)
        {
            response.ProductionOrder = new TraceabilityProductionOrderDto
            {
                OrderId = prodOrder.Id,
                OrderNumber = prodOrder.OrderNumber,
                Status = prodOrder.Status,
                PlannedQuantity = prodOrder.PlannedQuantity,
                ProducedQuantity = prodOrder.ProducedQuantity,
                UnitOfMeasure = prodOrder.UnitOfMeasure,
                PlannedStartDate = prodOrder.PlannedStartDate,
                ActualStartDate = prodOrder.ActualStartDate,
                ActualEndDate = prodOrder.ActualEndDate,
                TotalEstimatedCost = prodOrder.TotalEstimatedCost,
                TotalActualCost = prodOrder.TotalActualCost,
                BomCode = prodOrder.BomHeader?.Code,
                RoutingCode = prodOrder.RoutingHeader?.Code
            };

            // Rastrear cada material consumido hacia su orden de compra y proveedor
            foreach (var mat in prodOrder.Materials)
            {
                string matLot = mat.LotNumber ?? string.Empty;

                // Buscar orden de compra correspondiente
                PurchaseOrderLine? poLine = null;
                if (!string.IsNullOrEmpty(matLot))
                {
                    poLine = await _context.PurchaseOrderLines
                        .Include(l => l.PurchaseOrder)
                            .ThenInclude(p => p!.Supplier)
                        .FirstOrDefaultAsync(l => l.GeneratedLotNumber == matLot && l.ItemId == mat.ItemId);
                }

                PurchaseOrder? po = poLine?.PurchaseOrder;
                Supplier? supplier = po?.Supplier;

                // Si no se encuentra por línea exacta, buscar en InventoryLots con relación a PurchaseOrder
                if (po == null && !string.IsNullOrEmpty(matLot))
                {
                    var invLot = await _context.InventoryLots
                        .Include(l => l.PurchaseOrder)
                            .ThenInclude(p => p!.Supplier)
                        .FirstOrDefaultAsync(l => l.LotNumber == matLot && l.ItemId == mat.ItemId);
                    po = invLot?.PurchaseOrder;
                    supplier = po?.Supplier;
                }

                // Fallback: buscar transacción de entrada por compra en Kardex
                if (po == null && !string.IsNullOrEmpty(matLot))
                {
                    var entryTx = await _context.InventoryTransactions
                        .FirstOrDefaultAsync(t => t.LotNumber == matLot && t.TransactionType == "ENTRADA_COMPRA");
                    if (entryTx != null && !string.IsNullOrEmpty(entryTx.ReferenceNumber))
                    {
                        po = await _context.PurchaseOrders
                            .Include(p => p.Supplier)
                            .FirstOrDefaultAsync(p => p.OrderNumber == entryTx.ReferenceNumber);
                        supplier = po?.Supplier;
                    }
                }

                response.Upstream.Add(new TraceabilityUpstreamItemDto
                {
                    ItemId = mat.ItemId,
                    ItemCode = mat.Item?.Code ?? string.Empty,
                    ItemName = mat.Item?.Name ?? string.Empty,
                    Category = mat.Item?.Category ?? string.Empty,
                    ConsumedQuantity = mat.ConsumedQuantity > 0 ? mat.ConsumedQuantity : mat.RequiredQuantity,
                    UnitOfMeasure = mat.UnitOfMeasure,
                    LotNumber = matLot,
                    SourceWarehouseCode = mat.SourceWarehouse?.Code ?? "ALM-001",
                    PurchaseOrderId = po?.Id,
                    PurchaseOrderNumber = po?.OrderNumber ?? "OC-N/A",
                    PurchaseOrderDate = po?.OrderDate,
                    ReceptionDate = po?.ReceivedDate,
                    SupplierId = supplier?.Id,
                    SupplierCode = supplier?.Code ?? "PROV-N/A",
                    SupplierName = supplier?.Name ?? "Proveedor Histórico",
                    SupplierContact = supplier?.ContactName
                });
            }
        }
        else if (category == "MP" || category == "EMP")
        {
            // El lote consultado es directamente una materia prima o empaque; su upstream es su propia compra y proveedor
            var poLine = await _context.PurchaseOrderLines
                .Include(l => l.PurchaseOrder)
                    .ThenInclude(p => p!.Supplier)
                .FirstOrDefaultAsync(l => l.GeneratedLotNumber == cleanLot && (item == null || l.ItemId == item.Id));

            var po = poLine?.PurchaseOrder ?? lot?.PurchaseOrder;
            var supplier = po?.Supplier;

            response.Upstream.Add(new TraceabilityUpstreamItemDto
            {
                ItemId = item?.Id ?? 0,
                ItemCode = item?.Code ?? string.Empty,
                ItemName = item?.Name ?? string.Empty,
                Category = category,
                ConsumedQuantity = initialQty,
                UnitOfMeasure = item?.UnitOfMeasure ?? "kg",
                LotNumber = cleanLot,
                SourceWarehouseCode = warehouse?.Code ?? "ALM-001",
                PurchaseOrderId = po?.Id,
                PurchaseOrderNumber = po?.OrderNumber ?? "OC-DIRECTA",
                PurchaseOrderDate = po?.OrderDate,
                ReceptionDate = po?.ReceivedDate,
                SupplierId = supplier?.Id,
                SupplierCode = supplier?.Code ?? "PROV-001",
                SupplierName = supplier?.Name ?? "Proveedor Asignado",
                SupplierContact = supplier?.ContactName
            });
        }

        // =========================================================================
        // TRAZABILIDAD DOWNSTREAM (HACIA ADELANTE)
        // =========================================================================

        if (category == "PT")
        {
            // 1. Rastrear transacciones de Kardex con tipo SALIDA_VENTA asociadas al lote
            var salesTxList = await _context.InventoryTransactions
                .Where(t => t.LotNumber == cleanLot && t.TransactionType == "SALIDA_VENTA")
                .ToListAsync();

            var salesOrderNumbers = salesTxList
                .Where(t => !string.IsNullOrEmpty(t.ReferenceNumber))
                .Select(t => t.ReferenceNumber!)
                .Distinct()
                .ToList();

            var salesOrders = await _context.SalesOrders
                .Include(s => s.Customer)
                .Include(s => s.Lines)
                    .ThenInclude(l => l.Item)
                .Where(s => salesOrderNumbers.Contains(s.OrderNumber))
                .ToListAsync();

            // 2. Rastrear también órdenes de venta donde el AssignedLotNumber contenga este lote
            var directLineMatches = await _context.SalesOrderLines
                .Include(l => l.SalesOrder)
                    .ThenInclude(s => s!.Customer)
                .Where(l => l.AssignedLotNumber != null && l.AssignedLotNumber.Contains(cleanLot))
                .ToListAsync();

            var processedOrderIds = new HashSet<int>();

            foreach (var tx in salesTxList)
            {
                var so = salesOrders.FirstOrDefault(s => s.OrderNumber == tx.ReferenceNumber);
                if (so != null && !processedOrderIds.Contains(so.Id))
                {
                    processedOrderIds.Add(so.Id);
                    var customer = so.Customer;
                    var line = so.Lines.FirstOrDefault(l => l.ItemId == (item?.Id ?? 0));

                    response.Downstream.Add(new TraceabilityDownstreamItemDto
                    {
                        SalesOrderId = so.Id,
                        SalesOrderNumber = so.OrderNumber,
                        CustomerId = customer?.Id ?? 0,
                        CustomerCode = customer?.Code ?? "CLI-N/A",
                        CustomerName = customer?.Name ?? "Cliente Desconocido",
                        CustomerAddress = customer?.Address,
                        CustomerContact = customer?.ContactName,
                        OrderDate = so.OrderDate,
                        DispatchedDate = so.DispatchedDate ?? tx.TransactionDate,
                        DispatchedQuantity = tx.Quantity,
                        UnitOfMeasure = item?.UnitOfMeasure ?? "bolsa",
                        UnitPrice = line?.UnitPrice ?? (item?.StandardCost ?? 0m),
                        Subtotal = Math.Round(tx.Quantity * (line?.UnitPrice ?? (item?.StandardCost ?? 0m)), 2),
                        AssignedLot = cleanLot
                    });
                }
            }

            foreach (var match in directLineMatches)
            {
                var so = match.SalesOrder;
                if (so != null && !processedOrderIds.Contains(so.Id))
                {
                    processedOrderIds.Add(so.Id);
                    var customer = so.Customer;

                    response.Downstream.Add(new TraceabilityDownstreamItemDto
                    {
                        SalesOrderId = so.Id,
                        SalesOrderNumber = so.OrderNumber,
                        CustomerId = customer?.Id ?? 0,
                        CustomerCode = customer?.Code ?? "CLI-N/A",
                        CustomerName = customer?.Name ?? "Cliente Desconocido",
                        CustomerAddress = customer?.Address,
                        CustomerContact = customer?.ContactName,
                        OrderDate = so.OrderDate,
                        DispatchedDate = so.DispatchedDate,
                        DispatchedQuantity = match.DispatchedQuantity > 0 ? match.DispatchedQuantity : match.Quantity,
                        UnitOfMeasure = match.UnitOfMeasure,
                        UnitPrice = match.UnitPrice,
                        Subtotal = match.Subtotal,
                        AssignedLot = match.AssignedLotNumber ?? cleanLot
                    });
                }
            }
        }
        else if (category == "MP" || category == "EMP")
        {
            // Para lotes de materia prima o empaque, downstream identifica qué OPs los consumieron y qué clientes recibieron el PT resultante
            var consumedInOps = await _context.ProductionOrderMaterials
                .Include(m => m.ProductionOrder)
                    .ThenInclude(p => p!.Item)
                .Where(m => m.LotNumber == cleanLot)
                .ToListAsync();

            foreach (var m in consumedInOps)
            {
                var op = m.ProductionOrder;
                if (op != null && !string.IsNullOrEmpty(op.LotNumber))
                {
                    // Rastrear ventas del lote de producto terminado resultante
                    var ptLot = op.LotNumber;
                    var ptSales = await _context.SalesOrderLines
                        .Include(l => l.SalesOrder)
                            .ThenInclude(s => s!.Customer)
                        .Where(l => l.AssignedLotNumber != null && l.AssignedLotNumber.Contains(ptLot))
                        .ToListAsync();

                    foreach (var sale in ptSales)
                    {
                        var so = sale.SalesOrder;
                        if (so != null)
                        {
                            response.Downstream.Add(new TraceabilityDownstreamItemDto
                            {
                                SalesOrderId = so.Id,
                                SalesOrderNumber = so.OrderNumber,
                                CustomerId = so.CustomerId,
                                CustomerCode = so.Customer?.Code ?? "CLI-N/A",
                                CustomerName = so.Customer?.Name ?? "Cliente",
                                CustomerAddress = so.Customer?.Address,
                                CustomerContact = so.Customer?.ContactName,
                                OrderDate = so.OrderDate,
                                DispatchedDate = so.DispatchedDate,
                                DispatchedQuantity = sale.DispatchedQuantity,
                                UnitOfMeasure = sale.UnitOfMeasure,
                                UnitPrice = sale.UnitPrice,
                                Subtotal = sale.Subtotal,
                                AssignedLot = $"PT: {ptLot} (Vía OP {op.OrderNumber})"
                            });
                        }
                    }
                }
            }
        }

        // =========================================================================
        // TIMELINE CRONOLÓGICO DE KARDEX ASOCIADO AL LOTE
        // =========================================================================
        var kardexTx = await _context.InventoryTransactions
            .Include(t => t.SourceWarehouse)
            .Include(t => t.DestinationWarehouse)
            .Where(t => t.LotNumber == cleanLot)
            .OrderBy(t => t.TransactionDate)
            .ThenBy(t => t.Id)
            .ToListAsync();

        response.KardexTimeline = kardexTx.Select(t => new TraceabilityKardexEntryDto
        {
            Id = t.Id,
            TransactionDate = t.TransactionDate,
            TransactionType = t.TransactionType,
            SourceWarehouseCode = t.SourceWarehouse?.Code,
            DestinationWarehouseCode = t.DestinationWarehouse?.Code,
            Quantity = t.Quantity,
            UnitCost = t.UnitCost,
            TotalCost = t.TotalCost,
            ReferenceNumber = t.ReferenceNumber,
            Notes = t.Notes,
            PerformedBy = t.PerformedBy
        }).ToList();

        return response;
    }

    public async Task<IEnumerable<TraceableLotSummaryDto>> GetTraceableLotsAsync(string? category = null)
    {
        var lots = await _context.InventoryLots
            .Include(l => l.Item)
            .Include(l => l.Warehouse)
            .Where(l => string.IsNullOrEmpty(category) || l.Item != null && l.Item.Category == category)
            .OrderByDescending(l => l.EntryDate)
            .Select(l => new TraceableLotSummaryDto
            {
                LotNumber = l.LotNumber,
                ItemCode = l.Item != null ? l.Item.Code : string.Empty,
                ItemName = l.Item != null ? l.Item.Name : string.Empty,
                Category = l.Item != null ? l.Item.Category : string.Empty,
                WarehouseCode = l.Warehouse != null ? l.Warehouse.Code : string.Empty,
                CurrentQuantity = l.CurrentQuantity,
                UnitOfMeasure = l.Item != null ? l.Item.UnitOfMeasure : "und",
                EntryDate = l.EntryDate,
                Status = l.Status
            })
            .ToListAsync();

        return lots;
    }
}
