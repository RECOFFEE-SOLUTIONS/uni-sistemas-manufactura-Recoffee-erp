using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchasesController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<PurchasesController> _logger;

    public PurchasesController(ReCoffeeDbContext context, ILogger<PurchasesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lista todas las órdenes de compra registradas.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseOrderResponseDto>>> GetPurchaseOrders(
        [FromQuery] string? status = null)
    {
        var query = _context.PurchaseOrders
            .AsNoTracking()
            .Include(p => p.Supplier)
            .Include(p => p.Lines)
                .ThenInclude(l => l.Item)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(p => p.Status.ToLower() == status.ToLower());
        }

        var orders = await query
            .OrderByDescending(p => p.OrderDate)
            .Select(p => new PurchaseOrderResponseDto
            {
                Id = p.Id,
                OrderNumber = p.OrderNumber,
                SupplierId = p.SupplierId,
                SupplierCode = p.Supplier != null ? p.Supplier.Code : string.Empty,
                SupplierName = p.Supplier != null ? p.Supplier.Name : string.Empty,
                OrderDate = p.OrderDate,
                ExpectedDeliveryDate = p.ExpectedDeliveryDate,
                ReceivedDate = p.ReceivedDate,
                Status = p.Status,
                TotalAmount = p.TotalAmount,
                Notes = p.Notes,
                LinesCount = p.Lines.Count,
                Lines = p.Lines.Select(l => new PurchaseOrderLineResponseDto
                {
                    Id = l.Id,
                    ItemId = l.ItemId,
                    ItemCode = l.Item != null ? l.Item.Code : string.Empty,
                    ItemName = l.Item != null ? l.Item.Name : string.Empty,
                    Category = l.Item != null ? l.Item.Category : string.Empty,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    Subtotal = l.Subtotal,
                    UnitOfMeasure = l.UnitOfMeasure,
                    ReceivedQuantity = l.ReceivedQuantity,
                    IsReceived = l.IsReceived,
                    GeneratedLotNumber = l.GeneratedLotNumber
                }).ToList(),
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    /// <summary>
    /// Obtiene el detalle de una orden de compra por su ID con todas sus líneas.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PurchaseOrderResponseDto>> GetPurchaseOrderById(int id)
    {
        var p = await _context.PurchaseOrders
            .AsNoTracking()
            .Include(p => p.Supplier)
            .Include(p => p.Lines)
                .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null)
        {
            return NotFound(new { message = $"No se encontró la orden de compra con ID {id}." });
        }

        var result = new PurchaseOrderResponseDto
        {
            Id = p.Id,
            OrderNumber = p.OrderNumber,
            SupplierId = p.SupplierId,
            SupplierCode = p.Supplier != null ? p.Supplier.Code : string.Empty,
            SupplierName = p.Supplier != null ? p.Supplier.Name : string.Empty,
            OrderDate = p.OrderDate,
            ExpectedDeliveryDate = p.ExpectedDeliveryDate,
            ReceivedDate = p.ReceivedDate,
            Status = p.Status,
            TotalAmount = p.TotalAmount,
            Notes = p.Notes,
            LinesCount = p.Lines.Count,
            Lines = p.Lines.Select(l => new PurchaseOrderLineResponseDto
            {
                Id = l.Id,
                ItemId = l.ItemId,
                ItemCode = l.Item != null ? l.Item.Code : string.Empty,
                ItemName = l.Item != null ? l.Item.Name : string.Empty,
                Category = l.Item != null ? l.Item.Category : string.Empty,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                Subtotal = l.Subtotal,
                UnitOfMeasure = l.UnitOfMeasure,
                ReceivedQuantity = l.ReceivedQuantity,
                IsReceived = l.IsReceived,
                GeneratedLotNumber = l.GeneratedLotNumber
            }).ToList(),
            CreatedAt = p.CreatedAt
        };

        return Ok(result);
    }

    /// <summary>
    /// Crea una nueva orden de compra para un proveedor.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PurchaseOrderResponseDto>> CreatePurchaseOrder([FromBody] CreatePurchaseOrderDto dto)
    {
        if (dto.SupplierId <= 0)
        {
            return BadRequest(new { message = "El ID del proveedor es obligatorio." });
        }

        if (dto.Lines == null || dto.Lines.Count == 0)
        {
            return BadRequest(new { message = "La orden de compra debe contener al menos una línea de artículo." });
        }

        var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
        if (supplier == null)
        {
            return NotFound(new { message = $"No se encontró el proveedor con ID {dto.SupplierId}." });
        }

        // Generar número de orden si no fue provisto
        string orderNumber = dto.OrderNumber?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(orderNumber))
        {
            var count = await _context.PurchaseOrders.CountAsync();
            orderNumber = $"OC-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";
        }
        else
        {
            var exists = await _context.PurchaseOrders.AnyAsync(o => o.OrderNumber == orderNumber);
            if (exists)
            {
                return Conflict(new { message = $"Ya existe una orden de compra con el número '{orderNumber}'." });
            }
        }

        var order = new PurchaseOrder
        {
            OrderNumber = orderNumber,
            SupplierId = dto.SupplierId,
            OrderDate = DateTime.UtcNow,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Status = "Emitida",
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            Lines = new List<PurchaseOrderLine>()
        };

        decimal totalAmount = 0m;

        foreach (var lineDto in dto.Lines)
        {
            if (lineDto.Quantity <= 0)
            {
                return BadRequest(new { message = "La cantidad de cada línea debe ser mayor a 0." });
            }

            var item = await _context.Items.FindAsync(lineDto.ItemId);
            if (item == null)
            {
                return NotFound(new { message = $"No se encontró el artículo con ID {lineDto.ItemId}." });
            }

            decimal unitPrice = lineDto.UnitPrice ?? item.Cost;
            decimal subtotal = Math.Round(unitPrice * lineDto.Quantity, 2);
            totalAmount += subtotal;

            order.Lines.Add(new PurchaseOrderLine
            {
                ItemId = item.Id,
                Quantity = lineDto.Quantity,
                UnitPrice = unitPrice,
                Subtotal = subtotal,
                UnitOfMeasure = !string.IsNullOrWhiteSpace(lineDto.UnitOfMeasure) ? lineDto.UnitOfMeasure : item.UnitOfMeasure,
                ReceivedQuantity = 0m,
                IsReceived = false
            });
        }

        order.TotalAmount = totalAmount;

        _context.PurchaseOrders.Add(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Orden de compra creada exitosamente: {OrderNumber} con {Lines} líneas por C$ {Total}",
            order.OrderNumber, order.Lines.Count, order.TotalAmount);

        return CreatedAtAction(nameof(GetPurchaseOrderById), new { id = order.Id }, new PurchaseOrderResponseDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            SupplierId = order.SupplierId,
            SupplierCode = supplier.Code,
            SupplierName = supplier.Name,
            OrderDate = order.OrderDate,
            ExpectedDeliveryDate = order.ExpectedDeliveryDate,
            ReceivedDate = order.ReceivedDate,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            Notes = order.Notes,
            LinesCount = order.Lines.Count,
            CreatedAt = order.CreatedAt
        });
    }

    /// <summary>
    /// Confirma la recepción de materiales de una orden de compra:
    /// - Genera identificador único de lote por artículo (LOTE-MP-001, etc.)
    /// - Incrementa automáticamente el stock en ALM-001 (MP) o ALM-004 (EMP)
    /// - Registra las transacciones en el Kardex y actualiza la orden a 'Recibida'.
    /// </summary>
    [HttpPost("{id:int}/receive")]
    public async Task<ActionResult<PurchaseReceptionResultDto>> ReceivePurchaseOrder(
        int id,
        [FromBody] ReceivePurchaseOrderDto? dto = null)
    {
        var order = await _context.PurchaseOrders
            .Include(p => p.Lines)
                .ThenInclude(l => l.Item)
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"No se encontró la orden de compra con ID {id}." });
        }

        if (order.Status == "Recibida")
        {
            return BadRequest(new { message = $"La orden de compra '{order.OrderNumber}' ya fue recibida anteriormente." });
        }

        if (order.Status == "Cancelada")
        {
            return BadRequest(new { message = $"No se puede recibir una orden de compra cancelada." });
        }

        // Obtener almacenes de destino según caso de estudio
        var almMP = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-001");
        var almEMP = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-004");

        if (almMP == null || almEMP == null)
        {
            return BadRequest(new { message = "Los almacenes de destino (ALM-001 o ALM-004) no se encuentran configurados en la base de datos." });
        }

        DateTime receptionDate = dto?.ReceptionDate ?? DateTime.UtcNow;
        var generatedLots = new List<GeneratedLotSummaryDto>();

        foreach (var line in order.Lines)
        {
            var item = line.Item;
            if (item == null) continue;

            // Determinar almacén de destino según categoría del artículo
            // MP -> ALM-001 (Materias Primas)
            // EMP -> ALM-004 (Empaques e Identificación)
            var targetWarehouse = (item.Category == "EMP") ? almEMP : almMP;

            // Generar identificador de Lote de entrada con formato LOTE-{ItemCode}-{Fecha}-{Id}
            var lotCount = await _context.InventoryLots.CountAsync(l => l.ItemId == item.Id);
            string lotNumber = $"LOTE-{item.Code}-{(lotCount + 1):D3}";

            // Asegurar unicidad si el lote ya existe
            if (await _context.InventoryLots.AnyAsync(l => l.LotNumber == lotNumber))
            {
                lotNumber = $"LOTE-{item.Code}-{receptionDate:yyyyMMdd}-{order.Id:D3}-{(lotCount + 1):D2}";
            }

            // 1. Crear registro de Lote de Inventario
            var lot = new InventoryLot
            {
                LotNumber = lotNumber,
                ItemId = item.Id,
                WarehouseId = targetWarehouse.Id,
                InitialQuantity = line.Quantity,
                CurrentQuantity = line.Quantity,
                PurchaseOrderId = order.Id,
                EntryDate = receptionDate,
                Status = "Disponible",
                Notes = $"Recepción de compra {order.OrderNumber} de {order.Supplier?.Name}",
                CreatedAt = DateTime.UtcNow
            };
            _context.InventoryLots.Add(lot);

            // 2. Incrementar stock físico consolidado en el almacén destino
            var stock = await _context.InventoryStocks
                .FirstOrDefaultAsync(s => s.WarehouseId == targetWarehouse.Id && s.ItemId == item.Id);

            if (stock == null)
            {
                stock = new InventoryStock
                {
                    WarehouseId = targetWarehouse.Id,
                    ItemId = item.Id,
                    Quantity = line.Quantity,
                    LastUpdated = DateTime.UtcNow
                };
                _context.InventoryStocks.Add(stock);
            }
            else
            {
                stock.Quantity += line.Quantity;
                stock.LastUpdated = DateTime.UtcNow;
            }

            // 3. Registrar movimiento en Kardex de inventario
            var movement = new InventoryMovement
            {
                MovementDate = receptionDate,
                MovementType = "RECEPCION_COMPRA",
                ItemId = item.Id,
                WarehouseId = targetWarehouse.Id,
                LotNumber = lotNumber,
                Quantity = line.Quantity,
                UnitCost = line.UnitPrice,
                TotalCost = line.Subtotal,
                ReferenceNumber = order.OrderNumber,
                Notes = $"Entrada por recepción de orden de compra {order.OrderNumber}. Proveedor: {order.Supplier?.Name}",
                CreatedAt = DateTime.UtcNow
            };
            _context.InventoryMovements.Add(movement);

            // 4. Actualizar la línea de orden de compra
            line.IsReceived = true;
            line.ReceivedQuantity = line.Quantity;
            line.GeneratedLotNumber = lotNumber;

            generatedLots.Add(new GeneratedLotSummaryDto
            {
                LotNumber = lotNumber,
                ItemId = item.Id,
                ItemCode = item.Code,
                ItemName = item.Name,
                WarehouseCode = targetWarehouse.Code,
                WarehouseName = targetWarehouse.Name,
                QuantityReceived = line.Quantity,
                UnitOfMeasure = line.UnitOfMeasure,
                NewStockBalance = stock.Quantity
            });
        }

        // 5. Actualizar estado de la orden de compra
        order.Status = "Recibida";
        order.ReceivedDate = receptionDate;
        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            order.Notes = string.IsNullOrEmpty(order.Notes)
                ? dto.Notes
                : $"{order.Notes} | Recepción: {dto.Notes}";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Orden de compra {OrderNumber} recibida exitosamente. Lotes generados: {LotsCount}",
            order.OrderNumber, generatedLots.Count);

        return Ok(new PurchaseReceptionResultDto
        {
            PurchaseOrderId = order.Id,
            OrderNumber = order.OrderNumber,
            ReceivedDate = order.ReceivedDate.Value,
            Status = order.Status,
            Message = $"Recepción completada exitosamente. Se generaron {generatedLots.Count} lotes y se incrementó el stock en los almacenes correspondientes.",
            GeneratedLots = generatedLots
        });
    }
}
