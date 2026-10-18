using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<SalesController> _logger;

    public SalesController(ReCoffeeDbContext context, ILogger<SalesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lista todas las órdenes de venta registradas en el sistema.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalesOrderResponseDto>>> GetOrders()
    {
        var orders = await _context.SalesOrders
            .Include(s => s.Customer)
            .Include(s => s.Lines)
                .ThenInclude(l => l.Item)
            .OrderByDescending(s => s.OrderDate)
            .ToListAsync();

        var result = orders.Select(o => MapToResponseDto(o)).ToList();
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de una orden de venta por su ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SalesOrderResponseDto>> GetOrderById(int id)
    {
        var order = await _context.SalesOrders
            .Include(s => s.Customer)
            .Include(s => s.Lines)
                .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"No se encontró la orden de venta con ID {id}." });
        }

        return Ok(MapToResponseDto(order));
    }

    /// <summary>
    /// Crea una nueva orden de venta para un cliente.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SalesOrderResponseDto>> CreateOrder([FromBody] CreateSalesOrderDto dto)
    {
        if (dto.CustomerId <= 0)
        {
            return BadRequest(new { message = "El ID del cliente es obligatorio." });
        }

        if (dto.Lines == null || dto.Lines.Count == 0)
        {
            return BadRequest(new { message = "La orden de venta debe contener al menos un artículo." });
        }

        var customer = await _context.Customers.FindAsync(dto.CustomerId);
        if (customer == null)
        {
            return NotFound(new { message = $"No se encontró el cliente con ID {dto.CustomerId}." });
        }

        var count = await _context.SalesOrders.CountAsync();
        string orderNumber = !string.IsNullOrWhiteSpace(dto.OrderNumber)
            ? dto.OrderNumber.Trim().ToUpperInvariant()
            : $"OV-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        if (await _context.SalesOrders.AnyAsync(s => s.OrderNumber == orderNumber))
        {
            return Conflict(new { message = $"Ya existe una orden de venta con el número '{orderNumber}'." });
        }

        var order = new SalesOrder
        {
            OrderNumber = orderNumber,
            CustomerId = customer.Id,
            OrderDate = DateTime.UtcNow,
            DeliveryDate = dto.DeliveryDate,
            Status = "Confirmada",
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        decimal totalAmount = 0m;

        foreach (var lineDto in dto.Lines)
        {
            if (lineDto.Quantity <= 0)
            {
                return BadRequest(new { message = "Las cantidades de los artículos deben ser estrictamente mayores a 0." });
            }

            var item = await _context.Items.FindAsync(lineDto.ItemId);
            if (item == null)
            {
                return NotFound(new { message = $"No se encontró el artículo con ID {lineDto.ItemId}." });
            }

            decimal price = lineDto.UnitPrice ?? (item.StandardCost > 0 ? item.StandardCost : item.Cost);
            decimal subtotal = Math.Round(lineDto.Quantity * price, 2);
            totalAmount += subtotal;

            order.Lines.Add(new SalesOrderLine
            {
                ItemId = item.Id,
                Quantity = lineDto.Quantity,
                UnitPrice = price,
                Subtotal = subtotal,
                UnitOfMeasure = !string.IsNullOrWhiteSpace(lineDto.UnitOfMeasure) ? lineDto.UnitOfMeasure : item.UnitOfMeasure,
                DispatchedQuantity = 0m,
                IsDispatched = false
            });
        }

        order.TotalAmount = totalAmount;

        _context.SalesOrders.Add(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Orden de venta creada: {OrderNumber} para cliente {CustomerName}. Total: C$ {Total}",
            order.OrderNumber, customer.Name, order.TotalAmount);

        var created = await _context.SalesOrders
            .Include(s => s.Customer)
            .Include(s => s.Lines)
                .ThenInclude(l => l.Item)
            .FirstAsync(s => s.Id == order.Id);

        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, MapToResponseDto(created));
    }

    /// <summary>
    /// Despacha una orden de venta:
    /// 1. Valida stock físico en ALM-003 (Almacén de Producto Terminado). Bloquea si es insuficiente.
    /// 2. Selecciona lotes mediante algoritmo FIFO (más antiguos primero).
    /// 3. Descuenta existencias en ALM-003.
    /// 4. Registra salida de mercancía en el Kardex inmutable (InventoryTransaction con tipo SALIDA_VENTA).
    /// 5. Actualiza la orden a estado 'Despachada'.
    /// </summary>
    [HttpPost("{id:int}/dispatch")]
    public async Task<ActionResult<DispatchSalesOrderResultDto>> DispatchOrder(
        int id,
        [FromBody] DispatchSalesOrderDto? dto = null)
    {
        var order = await _context.SalesOrders
            .Include(s => s.Customer)
            .Include(s => s.Lines)
                .ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"No se encontró la orden de venta con ID {id}." });
        }

        if (order.Status == "Despachada")
        {
            return BadRequest(new { message = $"La orden '{order.OrderNumber}' ya fue despachada anteriormente el {order.DispatchedDate:yyyy-MM-dd HH:mm}." });
        }

        if (order.Status == "Cancelada")
        {
            return BadRequest(new { message = $"La orden '{order.OrderNumber}' se encuentra cancelada y no puede ser despachada." });
        }

        if (!order.Lines.Any())
        {
            return BadRequest(new { message = $"La orden '{order.OrderNumber}' no posee líneas para despachar." });
        }

        // Buscar el almacén de despacho de producto terminado (ALM-003)
        var alm003 = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-003");
        if (alm003 == null)
        {
            return BadRequest(new { message = "El almacén de producto terminado y ventas (ALM-003) no está configurado en el sistema." });
        }

        DateTime dispatchDate = dto?.DispatchDate ?? DateTime.UtcNow;

        // FASE 1: VALIDACIÓN ESTRICTA DE STOCK DISPONIBLE EN ALM-003 PARA TODAS LAS LÍNEAS
        foreach (var line in order.Lines)
        {
            var item = line.Item;
            string itemName = item?.Name ?? $"Artículo #{line.ItemId}";
            string itemCode = item?.Code ?? "PT";

            var availableStock = await _context.InventoryStocks
                .Where(s => s.WarehouseId == alm003.Id && s.ItemId == line.ItemId && s.Quantity > 0)
                .SumAsync(s => (decimal?)s.Quantity) ?? 0m;

            if (availableStock < line.Quantity)
            {
                _logger.LogWarning("Bloqueo de despacho en OV {OrderNumber}: stock insuficiente para {ItemCode} en ALM-003. Requerido: {Req}, Disponible: {Disp}",
                    order.OrderNumber, itemCode, line.Quantity, availableStock);

                return BadRequest(new
                {
                    message = $"Stock insuficiente en el almacén de producto terminado y despacho (ALM-003) para el producto '{itemName}' ({itemCode}). Se requieren {line.Quantity} {line.UnitOfMeasure}, pero solo hay {availableStock} {line.UnitOfMeasure} disponibles en existencia.",
                    itemCode = itemCode,
                    requiredQuantity = line.Quantity,
                    availableQuantity = availableStock,
                    warehouse = "ALM-003"
                });
            }
        }

        // FASE 2: DESPACHO CON ALGORITMO FIFO Y REGISTRO EN KARDEX INMUTABLE
        var allocatedLots = new List<DispatchedLotAllocationDto>();
        decimal totalDispatchedQty = 0m;

        foreach (var line in order.Lines)
        {
            decimal remainingToDispatch = line.Quantity;
            var assignedLotsForLine = new List<string>();

            // Obtener stocks en ALM-003 con cantidades positivas
            var stocksInAlm = await _context.InventoryStocks
                .Where(s => s.WarehouseId == alm003.Id && s.ItemId == line.ItemId && s.Quantity > 0)
                .ToListAsync();

            // Para garantizar FIFO auténtico, relacionamos con InventoryLot para ordenar por EntryDate ascendente (y por Id ascendente)
            var lotNumbers = stocksInAlm.Select(s => s.LotNumber).Distinct().ToList();
            var lotsMetadata = await _context.InventoryLots
                .Where(l => lotNumbers.Contains(l.LotNumber) && l.ItemId == line.ItemId)
                .ToListAsync();

            var lotsDateMap = lotsMetadata.ToDictionary(l => l.LotNumber, l => l.EntryDate);

            // Ordenamiento FIFO: fecha de ingreso más antigua primero
            var orderedStocks = stocksInAlm
                .OrderBy(s => lotsDateMap.ContainsKey(s.LotNumber) ? lotsDateMap[s.LotNumber] : DateTime.MaxValue)
                .ThenBy(s => s.Id)
                .ToList();

            foreach (var stockEntry in orderedStocks)
            {
                if (remainingToDispatch <= 0) break;

                decimal deduct = Math.Min(stockEntry.Quantity, remainingToDispatch);
                stockEntry.Quantity -= deduct;
                stockEntry.LastUpdated = dispatchDate;

                // Descontar también en la entidad trazable de lotes si existe
                var invLot = lotsMetadata.FirstOrDefault(l => l.LotNumber == stockEntry.LotNumber);
                if (invLot != null)
                {
                    invLot.CurrentQuantity = Math.Max(0m, invLot.CurrentQuantity - deduct);
                    if (invLot.CurrentQuantity == 0)
                    {
                        invLot.Status = "Agotado";
                    }
                }

                remainingToDispatch -= deduct;
                totalDispatchedQty += deduct;
                assignedLotsForLine.Add($"{stockEntry.LotNumber} ({deduct} {line.UnitOfMeasure})");

                decimal unitCost = line.Item?.Cost ?? 0m;
                decimal totalCost = Math.Round(deduct * unitCost, 2);

                // Registrar salida de mercancía en el Kardex inmutable
                var kardexTx = new InventoryTransaction
                {
                    TransactionDate = dispatchDate,
                    TransactionType = "SALIDA_VENTA",
                    ItemId = line.ItemId,
                    SourceWarehouseId = alm003.Id,
                    DestinationWarehouseId = null,
                    LotNumber = stockEntry.LotNumber,
                    Quantity = deduct,
                    UnitCost = unitCost,
                    TotalCost = totalCost,
                    ReferenceNumber = order.OrderNumber,
                    Notes = $"Despacho por venta a cliente {order.Customer?.Name} ({order.Customer?.Code}) bajo Orden {order.OrderNumber}. Lote FIFO: {stockEntry.LotNumber}.",
                    PerformedBy = "Módulo de Ventas",
                    CreatedAt = dispatchDate
                };
                _context.InventoryTransactions.Add(kardexTx);

                allocatedLots.Add(new DispatchedLotAllocationDto
                {
                    ItemCode = line.Item?.Code ?? "PT",
                    ItemName = line.Item?.Name ?? "Producto Terminado",
                    LotNumber = stockEntry.LotNumber,
                    AllocatedQuantity = deduct,
                    WarehouseCode = "ALM-003",
                    UnitCost = unitCost,
                    TotalCost = totalCost
                });
            }

            line.DispatchedQuantity = line.Quantity;
            line.IsDispatched = true;
            line.AssignedLotNumber = string.Join(", ", assignedLotsForLine);
        }

        // FASE 3: ACTUALIZACIÓN DE ESTADO DE LA ORDEN DE VENTA
        order.Status = "Despachada";
        order.DispatchedDate = dispatchDate;
        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                ? dto.Notes
                : $"{order.Notes} | Despacho: {dto.Notes}";
        }

        await _context.SaveChangesAsync();

        // Calcular stock remanente en ALM-003 para los artículos despachados
        var itemIds = order.Lines.Select(l => l.ItemId).Distinct().ToList();
        var remainingStock = await _context.InventoryStocks
            .Where(s => s.WarehouseId == alm003.Id && itemIds.Contains(s.ItemId))
            .SumAsync(s => (decimal?)s.Quantity) ?? 0m;

        _logger.LogInformation("Orden de Venta {OrderNumber} despachada exitosamente a {CustomerName}. Cantidad total: {TotalQty}. Lotes asignados: {LotsCount}",
            order.OrderNumber, order.Customer?.Name, totalDispatchedQty, allocatedLots.Count);

        return Ok(new DispatchSalesOrderResultDto
        {
            SalesOrderId = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerCode = order.Customer?.Code ?? string.Empty,
            CustomerName = order.Customer?.Name ?? string.Empty,
            DispatchedDate = dispatchDate,
            Status = order.Status,
            TotalDispatchedQuantity = totalDispatchedQty,
            TotalAmount = order.TotalAmount,
            WarehouseCode = "ALM-003",
            AllocatedLots = allocatedLots,
            RemainingStockInWarehouse = remainingStock,
            Message = $"Orden de venta {order.OrderNumber} despachada exitosamente. Se aplicó FIFO sobre ALM-003 con salida registrada en Kardex para el cliente {order.Customer?.Name}."
        });
    }

    private static SalesOrderResponseDto MapToResponseDto(SalesOrder o)
    {
        return new SalesOrderResponseDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            CustomerId = o.CustomerId,
            CustomerCode = o.Customer?.Code ?? string.Empty,
            CustomerName = o.Customer?.Name ?? string.Empty,
            OrderDate = o.OrderDate,
            DeliveryDate = o.DeliveryDate,
            DispatchedDate = o.DispatchedDate,
            Status = o.Status,
            TotalAmount = o.TotalAmount,
            Notes = o.Notes,
            LinesCount = o.Lines.Count,
            CreatedAt = o.CreatedAt,
            Lines = o.Lines.Select(l => new SalesOrderLineResponseDto
            {
                Id = l.Id,
                ItemId = l.ItemId,
                ItemCode = l.Item?.Code ?? string.Empty,
                ItemName = l.Item?.Name ?? string.Empty,
                Category = l.Item?.Category ?? string.Empty,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                Subtotal = l.Subtotal,
                UnitOfMeasure = l.UnitOfMeasure,
                DispatchedQuantity = l.DispatchedQuantity,
                IsDispatched = l.IsDispatched,
                AssignedLotNumber = l.AssignedLotNumber
            }).ToList()
        };
    }
}
