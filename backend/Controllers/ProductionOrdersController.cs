using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/production/orders")]
public class ProductionOrdersController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly IBomExplosionService _bomService;
    private readonly ILogger<ProductionOrdersController> _logger;

    public ProductionOrdersController(
        ReCoffeeDbContext context,
        IBomExplosionService bomService,
        ILogger<ProductionOrdersController> logger)
    {
        _context = context;
        _bomService = bomService;
        _logger = logger;
    }

    /// <summary>
    /// Lista todas las órdenes de producción registradas.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductionOrderResponseDto>>> GetOrders([FromQuery] string? status = null)
    {
        var query = _context.ProductionOrders
            .AsNoTracking()
            .Include(p => p.Item)
            .Include(p => p.BomHeader)
            .Include(p => p.RoutingHeader)
            .Include(p => p.Materials)
                .ThenInclude(m => m.Item)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(p => p.Status.ToLower() == status.ToLower());
        }

        var orders = await query
            .OrderByDescending(p => p.PlannedStartDate)
            .ThenByDescending(p => p.Id)
            .Select(p => new ProductionOrderResponseDto
            {
                Id = p.Id,
                OrderNumber = p.OrderNumber,
                ItemId = p.ItemId,
                ItemCode = p.Item != null ? p.Item.Code : string.Empty,
                ItemName = p.Item != null ? p.Item.Name : string.Empty,
                Category = p.Item != null ? p.Item.Category : string.Empty,
                BomHeaderId = p.BomHeaderId,
                BomCode = p.BomHeader != null ? p.BomHeader.Code : null,
                BomVersion = p.BomHeader != null ? p.BomHeader.Version : null,
                RoutingHeaderId = p.RoutingHeaderId,
                RoutingCode = p.RoutingHeader != null ? p.RoutingHeader.Code : null,
                PlannedQuantity = p.PlannedQuantity,
                ProducedQuantity = p.ProducedQuantity,
                ScrapQuantity = p.ScrapQuantity,
                UnitOfMeasure = p.UnitOfMeasure,
                PlannedStartDate = p.PlannedStartDate,
                PlannedEndDate = p.PlannedEndDate,
                ActualStartDate = p.ActualStartDate,
                ActualEndDate = p.ActualEndDate,
                Status = p.Status,
                LotNumber = p.LotNumber,
                TotalEstimatedCost = p.TotalEstimatedCost,
                TotalActualCost = p.TotalActualCost,
                Notes = p.Notes,
                MaterialsCount = p.Materials.Count,
                Materials = p.Materials.Select(m => new ProductionOrderMaterialResponseDto
                {
                    Id = m.Id,
                    ItemId = m.ItemId,
                    ItemCode = m.Item != null ? m.Item.Code : string.Empty,
                    ItemName = m.Item != null ? m.Item.Name : string.Empty,
                    Category = m.Item != null ? m.Item.Category : string.Empty,
                    RequiredQuantity = m.RequiredQuantity,
                    ConsumedQuantity = m.ConsumedQuantity,
                    UnitOfMeasure = m.UnitOfMeasure,
                    UnitCost = m.UnitCost,
                    TotalCost = m.TotalCost,
                    SourceWarehouseId = m.SourceWarehouseId,
                    WipWarehouseId = m.WipWarehouseId,
                    LotNumber = m.LotNumber,
                    IsConsumed = m.IsConsumed,
                    ConsumedAt = m.ConsumedAt
                }).ToList(),
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    /// <summary>
    /// Obtiene el detalle de una orden de producción específica por su ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductionOrderResponseDto>> GetOrderById(int id)
    {
        var p = await _context.ProductionOrders
            .AsNoTracking()
            .Include(p => p.Item)
            .Include(p => p.BomHeader)
            .Include(p => p.RoutingHeader)
            .Include(p => p.Materials)
                .ThenInclude(m => m.Item)
            .Include(p => p.Materials)
                .ThenInclude(m => m.SourceWarehouse)
            .Include(p => p.Materials)
                .ThenInclude(m => m.WipWarehouse)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null)
        {
            return NotFound(new { message = $"No se encontró la orden de producción con ID {id}." });
        }

        var result = new ProductionOrderResponseDto
        {
            Id = p.Id,
            OrderNumber = p.OrderNumber,
            ItemId = p.ItemId,
            ItemCode = p.Item != null ? p.Item.Code : string.Empty,
            ItemName = p.Item != null ? p.Item.Name : string.Empty,
            Category = p.Item != null ? p.Item.Category : string.Empty,
            BomHeaderId = p.BomHeaderId,
            BomCode = p.BomHeader != null ? p.BomHeader.Code : null,
            BomVersion = p.BomHeader != null ? p.BomHeader.Version : null,
            RoutingHeaderId = p.RoutingHeaderId,
            RoutingCode = p.RoutingHeader != null ? p.RoutingHeader.Code : null,
            PlannedQuantity = p.PlannedQuantity,
            ProducedQuantity = p.ProducedQuantity,
            ScrapQuantity = p.ScrapQuantity,
            UnitOfMeasure = p.UnitOfMeasure,
            PlannedStartDate = p.PlannedStartDate,
            PlannedEndDate = p.PlannedEndDate,
            ActualStartDate = p.ActualStartDate,
            ActualEndDate = p.ActualEndDate,
            Status = p.Status,
            LotNumber = p.LotNumber,
            TotalEstimatedCost = p.TotalEstimatedCost,
            TotalActualCost = p.TotalActualCost,
            Notes = p.Notes,
            MaterialsCount = p.Materials.Count,
            Materials = p.Materials.Select(m => new ProductionOrderMaterialResponseDto
            {
                Id = m.Id,
                ItemId = m.ItemId,
                ItemCode = m.Item != null ? m.Item.Code : string.Empty,
                ItemName = m.Item != null ? m.Item.Name : string.Empty,
                Category = m.Item != null ? m.Item.Category : string.Empty,
                RequiredQuantity = m.RequiredQuantity,
                ConsumedQuantity = m.ConsumedQuantity,
                UnitOfMeasure = m.UnitOfMeasure,
                UnitCost = m.UnitCost,
                TotalCost = m.TotalCost,
                SourceWarehouseId = m.SourceWarehouseId,
                SourceWarehouseCode = m.SourceWarehouse != null ? m.SourceWarehouse.Code : null,
                SourceWarehouseName = m.SourceWarehouse != null ? m.SourceWarehouse.Name : null,
                WipWarehouseId = m.WipWarehouseId,
                WipWarehouseCode = m.WipWarehouse != null ? m.WipWarehouse.Code : null,
                WipWarehouseName = m.WipWarehouse != null ? m.WipWarehouse.Name : null,
                LotNumber = m.LotNumber,
                IsConsumed = m.IsConsumed,
                ConsumedAt = m.ConsumedAt
            }).ToList(),
            CreatedAt = p.CreatedAt
        };

        return Ok(result);
    }

    /// <summary>
    /// Crea una nueva orden de producción vinculándola con la receta activa (BOM) y la ruta estándar.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProductionOrderResponseDto>> CreateOrder([FromBody] CreateProductionOrderDto dto)
    {
        if (dto.ItemId <= 0)
        {
            return BadRequest(new { message = "El ID del artículo a fabricar es obligatorio." });
        }

        if (dto.PlannedQuantity <= 0)
        {
            return BadRequest(new { message = "La cantidad planificada debe ser estrictamente mayor a 0." });
        }

        var item = await _context.Items.FindAsync(dto.ItemId);
        if (item == null)
        {
            return NotFound(new { message = $"No se encontró el artículo con ID {dto.ItemId}." });
        }

        // Buscar receta BOM activa
        var bom = await _context.BomHeaders.FirstOrDefaultAsync(b => b.ParentItemId == item.Id && b.IsActive);
        if (bom == null)
        {
            return BadRequest(new { message = $"El artículo '{item.Code}' no tiene una lista de materiales (BOM) activa." });
        }

        // Buscar ruta estándar activa
        var routing = await _context.RoutingHeaders.FirstOrDefaultAsync(r => r.ItemId == item.Id && r.IsActive);

        // Calcular explosión de materiales preliminar para estimar costos
        var explosion = await _bomService.ExplodeBomAsync(item.Id, dto.PlannedQuantity);

        var count = await _context.ProductionOrders.CountAsync();
        string orderNumber = $"OP-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var order = new ProductionOrder
        {
            OrderNumber = orderNumber,
            ItemId = item.Id,
            BomHeaderId = bom.Id,
            RoutingHeaderId = routing?.Id,
            PlannedQuantity = dto.PlannedQuantity,
            ProducedQuantity = 0m,
            ScrapQuantity = 0m,
            UnitOfMeasure = item.UnitOfMeasure,
            PlannedStartDate = dto.PlannedStartDate ?? DateTime.UtcNow,
            PlannedEndDate = dto.PlannedEndDate ?? DateTime.UtcNow.AddHours(34),
            Status = "Planificada",
            Notes = dto.Notes,
            TotalEstimatedCost = explosion.TotalEstimatedCost,
            TotalActualCost = 0m,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProductionOrders.Add(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Orden de producción creada: {OrderNumber} para fabricar {Qty} {Uom} de {ItemCode}. Costo Estimado: C$ {Cost}",
            order.OrderNumber, order.PlannedQuantity, order.UnitOfMeasure, item.Code, order.TotalEstimatedCost);

        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, new ProductionOrderResponseDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            ItemId = order.ItemId,
            ItemCode = item.Code,
            ItemName = item.Name,
            Category = item.Category,
            BomHeaderId = order.BomHeaderId,
            BomCode = bom.Code,
            BomVersion = bom.Version,
            RoutingHeaderId = order.RoutingHeaderId,
            RoutingCode = routing?.Code,
            PlannedQuantity = order.PlannedQuantity,
            ProducedQuantity = order.ProducedQuantity,
            ScrapQuantity = order.ScrapQuantity,
            UnitOfMeasure = order.UnitOfMeasure,
            PlannedStartDate = order.PlannedStartDate,
            PlannedEndDate = order.PlannedEndDate,
            Status = order.Status,
            TotalEstimatedCost = order.TotalEstimatedCost,
            TotalActualCost = order.TotalActualCost,
            Notes = order.Notes,
            CreatedAt = order.CreatedAt
        });
    }

    /// <summary>
    /// Inicia la orden de producción (cambio a estado 'En Proceso'):
    /// 1. Invoca el servicio de explosión de BOM para calcular los requerimientos exactos de materiales.
    /// 2. Aplica validación estricta de stock en ALM-001 (MP) y ALM-004 (EMP). Bloquea si hay déficit.
    /// 3. Genera la salida física de almacenes de origen y registra la entrada simultánea como WIP en ALM-002.
    /// 4. Genera el identificador de lote de producto terminado.
    /// </summary>
    [HttpPost("{id:int}/start")]
    public async Task<ActionResult<StartProductionOrderResultDto>> StartProductionOrder(int id)
    {
        var order = await _context.ProductionOrders
            .Include(p => p.Item)
            .Include(p => p.Materials)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"No se encontró la orden de producción con ID {id}." });
        }

        if (order.Status == "En Proceso")
        {
            return BadRequest(new { message = $"La orden de producción '{order.OrderNumber}' ya se encuentra en proceso." });
        }

        if (order.Status == "Completada")
        {
            return BadRequest(new { message = $"La orden de producción '{order.OrderNumber}' ya fue completada anteriormente." });
        }

        // Obtener almacenes de origen y destino
        var almMp = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-001");
        var almEmp = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-004");
        var almWip = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-002"); // Almacén de Producción / WIP

        if (almMp == null || almEmp == null || almWip == null)
        {
            return BadRequest(new { message = "Uno o más almacenes requeridos (ALM-001, ALM-002, ALM-004) no están configurados." });
        }

        // 1. Invocar el servicio de explosión de BOM para el lote planificado
        var explosion = await _bomService.ExplodeBomAsync(order.ItemId, order.PlannedQuantity);

        // 2. VALIDACIÓN ESTRICTA DE STOCK: Verificar disponibilidad en ALM-001 (MP) y ALM-004 (EMP)
        var stockDeficits = new List<string>();

        foreach (var mat in explosion.ConsolidatedMaterials)
        {
            var targetSourceWarehouse = (mat.Category == "EMP") ? almEmp : almMp;

            var availableStock = await _context.InventoryStocks
                .Where(s => s.WarehouseId == targetSourceWarehouse.Id && s.ItemId == mat.ItemId)
                .SumAsync(s => s.Quantity - s.ReservedQuantity);

            if (availableStock < mat.RequiredQuantity)
            {
                stockDeficits.Add(
                    $"Material '{mat.ItemCode} - {mat.ItemName}' en {targetSourceWarehouse.Code}: " +
                    $"Disponible: {availableStock} {mat.UnitOfMeasure}, Requerido por BOM: {mat.RequiredQuantity} {mat.UnitOfMeasure} " +
                    $"(Déficit: {mat.RequiredQuantity - availableStock} {mat.UnitOfMeasure})");
            }
        }

        // BLOQUEO ESTRICTO SI HAY DÉFICIT
        if (stockDeficits.Count > 0)
        {
            _logger.LogWarning("Inicio de OP {OrderNumber} bloqueado por stock insuficiente: {Deficits}",
                order.OrderNumber, string.Join("; ", stockDeficits));

            return BadRequest(new
            {
                message = "Bloqueo transaccional: Stock insuficiente de materiales en almacenes de origen para iniciar la orden de producción.",
                deficits = stockDeficits
            });
        }

        // 3. TRANSFERENCIA AUTOMÁTICA DE MATERIALES A TRABAJO EN PROCESO (WIP - ALM-002)
        var transferredDetails = new List<WipTransferDetailDto>();
        DateTime executionTime = DateTime.UtcNow;

        foreach (var mat in explosion.ConsolidatedMaterials)
        {
            var targetSourceWarehouse = (mat.Category == "EMP") ? almEmp : almMp;

            // Descontar del almacén de origen (FIFO por lote)
            var sourceStocks = await _context.InventoryStocks
                .Where(s => s.WarehouseId == targetSourceWarehouse.Id && s.ItemId == mat.ItemId && s.Quantity > 0)
                .OrderBy(s => s.Id)
                .ToListAsync();

            decimal remainingToDeduct = mat.RequiredQuantity;
            string usedLot = string.Empty;

            foreach (var stockRecord in sourceStocks)
            {
                if (remainingToDeduct <= 0) break;

                decimal deduct = Math.Min(stockRecord.Quantity, remainingToDeduct);
                stockRecord.Quantity -= deduct;
                stockRecord.LastUpdated = executionTime;
                remainingToDeduct -= deduct;

                if (string.IsNullOrEmpty(usedLot) && !string.IsNullOrEmpty(stockRecord.LotNumber))
                {
                    usedLot = stockRecord.LotNumber;
                }
            }

            // Incrementar stock en almacén de Producción / WIP (ALM-002)
            string wipLot = !string.IsNullOrEmpty(usedLot) ? usedLot : $"WIP-{mat.ItemCode}-{order.OrderNumber}";
            var wipStock = await _context.InventoryStocks
                .FirstOrDefaultAsync(s => s.WarehouseId == almWip.Id && s.ItemId == mat.ItemId && s.LotNumber == wipLot);

            if (wipStock == null)
            {
                wipStock = new InventoryStock
                {
                    WarehouseId = almWip.Id,
                    ItemId = mat.ItemId,
                    LotNumber = wipLot,
                    Quantity = mat.RequiredQuantity,
                    LastUpdated = executionTime
                };
                _context.InventoryStocks.Add(wipStock);
            }
            else
            {
                wipStock.Quantity += mat.RequiredQuantity;
                wipStock.LastUpdated = executionTime;
            }

            // Registrar movimiento en Kardex inmutable
            var kardexTx = new InventoryTransaction
            {
                TransactionDate = executionTime,
                TransactionType = "SALIDA_PRODUCCION",
                ItemId = mat.ItemId,
                SourceWarehouseId = targetSourceWarehouse.Id,
                DestinationWarehouseId = almWip.Id,
                LotNumber = wipLot,
                Quantity = mat.RequiredQuantity,
                UnitCost = mat.UnitCost,
                TotalCost = mat.TotalCost,
                ReferenceNumber = order.OrderNumber,
                Notes = $"Consumo de insumos por inicio de OP {order.OrderNumber} transferido a WIP ({almWip.Code}).",
                PerformedBy = "Módulo Producción MES",
                CreatedAt = executionTime
            };
            _context.InventoryTransactions.Add(kardexTx);

            // Registrar detalle en ProductionOrderMaterial
            var pom = new ProductionOrderMaterial
            {
                ProductionOrderId = order.Id,
                ItemId = mat.ItemId,
                RequiredQuantity = mat.RequiredQuantity,
                ConsumedQuantity = mat.RequiredQuantity,
                UnitOfMeasure = mat.UnitOfMeasure,
                UnitCost = mat.UnitCost,
                TotalCost = mat.TotalCost,
                SourceWarehouseId = targetSourceWarehouse.Id,
                WipWarehouseId = almWip.Id,
                LotNumber = wipLot,
                IsConsumed = true,
                ConsumedAt = executionTime
            };
            order.Materials.Add(pom);

            transferredDetails.Add(new WipTransferDetailDto
            {
                ItemId = mat.ItemId,
                ItemCode = mat.ItemCode,
                ItemName = mat.ItemName,
                SourceWarehouseCode = targetSourceWarehouse.Code,
                WipWarehouseCode = almWip.Code,
                QuantityTransferred = mat.RequiredQuantity,
                UnitOfMeasure = mat.UnitOfMeasure,
                UnitCost = mat.UnitCost,
                TotalCost = mat.TotalCost,
                LotNumber = wipLot
            });
        }

        // 4. Generar identificador de lote de salida para el producto terminado
        var ptCount = await _context.ProductionOrders.CountAsync(p => p.ItemId == order.ItemId && p.Status != "Planificada");
        string outputLotNumber = $"LOTE-{order.Item?.Code ?? "PT-001"}-{executionTime:yyyyMMdd}-{(ptCount + 1):D3}";

        // 5. Actualizar estado de la Orden de Producción
        order.Status = "En Proceso";
        order.ActualStartDate = executionTime;
        order.LotNumber = outputLotNumber;
        order.TotalActualCost = explosion.TotalEstimatedCost;

        await _context.SaveChangesAsync();

        _logger.LogInformation("OP {OrderNumber} iniciada con éxito. Lote de producción: {Lot}. Materiales transferidos a WIP (ALM-002): {Count}",
            order.OrderNumber, outputLotNumber, transferredDetails.Count);

        return Ok(new StartProductionOrderResultDto
        {
            ProductionOrderId = order.Id,
            OrderNumber = order.OrderNumber,
            Status = order.Status,
            ActualStartDate = order.ActualStartDate.Value,
            OutputLotNumber = outputLotNumber,
            TotalMaterialsConsumed = transferredDetails.Count,
            TotalWipCost = explosion.TotalEstimatedCost,
            TransferredMaterials = transferredDetails,
            Message = $"Orden de producción {order.OrderNumber} iniciada exitosamente. Se transfirieron {transferredDetails.Count} materiales desde ALM-001 y ALM-004 a WIP en ALM-002."
        });
    }
}
