using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class InventoryService : IInventoryService
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<InventoryService> _logger;

    public InventoryService(ReCoffeeDbContext context, ILogger<InventoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<InventoryStockResponseDto>> GetStockAsync(
        int? warehouseId,
        int? itemId,
        string? category,
        string? lotNumber)
    {
        var query = _context.InventoryStocks
            .AsNoTracking()
            .Include(s => s.Warehouse)
            .Include(s => s.Item)
            .Where(s => s.Quantity > 0)
            .AsQueryable();

        if (warehouseId.HasValue && warehouseId.Value > 0)
        {
            query = query.Where(s => s.WarehouseId == warehouseId.Value);
        }

        if (itemId.HasValue && itemId.Value > 0)
        {
            query = query.Where(s => s.ItemId == itemId.Value);
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "ALL")
        {
            query = query.Where(s => s.Item != null && s.Item.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(lotNumber))
        {
            query = query.Where(s => s.LotNumber.Contains(lotNumber));
        }

        var stocks = await query
            .OrderBy(s => s.Warehouse != null ? s.Warehouse.Code : "")
            .ThenBy(s => s.Item != null ? s.Item.Code : "")
            .Select(s => new InventoryStockResponseDto
            {
                Id = s.Id,
                WarehouseId = s.WarehouseId,
                WarehouseCode = s.Warehouse != null ? s.Warehouse.Code : string.Empty,
                WarehouseName = s.Warehouse != null ? s.Warehouse.Name : string.Empty,
                ItemId = s.ItemId,
                ItemCode = s.Item != null ? s.Item.Code : string.Empty,
                ItemName = s.Item != null ? s.Item.Name : string.Empty,
                Category = s.Item != null ? s.Item.Category : string.Empty,
                LotNumber = s.LotNumber,
                Quantity = s.Quantity,
                ReservedQuantity = s.ReservedQuantity,
                AvailableQuantity = s.Quantity - s.ReservedQuantity,
                UnitOfMeasure = s.Item != null ? s.Item.UnitOfMeasure : "kg",
                UnitCost = s.Item != null ? s.Item.Cost : 0m,
                TotalValue = (s.Item != null ? s.Item.Cost : 0m) * s.Quantity,
                LastUpdated = s.LastUpdated
            })
            .ToListAsync();

        return stocks;
    }

    public async Task<IEnumerable<InventoryStockSummaryDto>> GetStockSummaryAsync(string? category)
    {
        var stockList = await GetStockAsync(null, null, category, null);

        var grouped = stockList
            .GroupBy(s => new { s.ItemId, s.ItemCode, s.ItemName, s.Category, s.UnitOfMeasure, s.UnitCost })
            .Select(g => new InventoryStockSummaryDto
            {
                ItemId = g.Key.ItemId,
                ItemCode = g.Key.ItemCode,
                ItemName = g.Key.ItemName,
                Category = g.Key.Category,
                UnitOfMeasure = g.Key.UnitOfMeasure,
                TotalPhysicalQuantity = g.Sum(x => x.Quantity),
                TotalReservedQuantity = g.Sum(x => x.ReservedQuantity),
                TotalAvailableQuantity = g.Sum(x => x.AvailableQuantity),
                UnitCost = g.Key.UnitCost,
                TotalValuation = g.Sum(x => x.TotalValue),
                WarehouseBalances = g.ToList()
            })
            .OrderBy(x => x.Category)
            .ThenBy(x => x.ItemCode)
            .ToList();

        return grouped;
    }

    public async Task<IEnumerable<InventoryTransactionResponseDto>> GetKardexAsync(
        int? itemId,
        int? warehouseId,
        string? transactionType,
        DateTime? fromDate,
        DateTime? toDate)
    {
        var query = _context.InventoryTransactions
            .AsNoTracking()
            .Include(t => t.Item)
            .Include(t => t.SourceWarehouse)
            .Include(t => t.DestinationWarehouse)
            .AsQueryable();

        if (itemId.HasValue && itemId.Value > 0)
        {
            query = query.Where(t => t.ItemId == itemId.Value);
        }

        if (warehouseId.HasValue && warehouseId.Value > 0)
        {
            query = query.Where(t => t.SourceWarehouseId == warehouseId.Value || t.DestinationWarehouseId == warehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(transactionType))
        {
            query = query.Where(t => t.TransactionType == transactionType);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(t => t.TransactionDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(t => t.TransactionDate <= toDate.Value);
        }

        var list = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .Select(t => new InventoryTransactionResponseDto
            {
                Id = t.Id,
                TransactionDate = t.TransactionDate,
                TransactionType = t.TransactionType,
                ItemId = t.ItemId,
                ItemCode = t.Item != null ? t.Item.Code : string.Empty,
                ItemName = t.Item != null ? t.Item.Name : string.Empty,
                Category = t.Item != null ? t.Item.Category : string.Empty,
                SourceWarehouseId = t.SourceWarehouseId,
                SourceWarehouseCode = t.SourceWarehouse != null ? t.SourceWarehouse.Code : null,
                SourceWarehouseName = t.SourceWarehouse != null ? t.SourceWarehouse.Name : null,
                DestinationWarehouseId = t.DestinationWarehouseId,
                DestinationWarehouseCode = t.DestinationWarehouse != null ? t.DestinationWarehouse.Code : null,
                DestinationWarehouseName = t.DestinationWarehouse != null ? t.DestinationWarehouse.Name : null,
                LotNumber = t.LotNumber,
                Quantity = t.Quantity,
                UnitOfMeasure = t.Item != null ? t.Item.UnitOfMeasure : "kg",
                UnitCost = t.UnitCost,
                TotalCost = t.TotalCost,
                ReferenceNumber = t.ReferenceNumber,
                Notes = t.Notes,
                PerformedBy = t.PerformedBy,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return list;
    }

    public async Task<InventoryTransactionResponseDto> TransferStockAsync(TransferStockRequestDto dto, string? performedBy)
    {
        if (dto.Quantity <= 0)
        {
            throw new ArgumentException("La cantidad a transferir debe ser estrictamente mayor a cero.", nameof(dto.Quantity));
        }

        if (dto.SourceWarehouseId == dto.DestinationWarehouseId)
        {
            throw new InvalidOperationException("El almacén de origen y destino deben ser diferentes.");
        }

        var sourceWarehouse = await _context.Warehouses.FindAsync(dto.SourceWarehouseId);
        if (sourceWarehouse == null)
        {
            throw new KeyNotFoundException($"No se encontró el almacén de origen con ID {dto.SourceWarehouseId}.");
        }

        var destWarehouse = await _context.Warehouses.FindAsync(dto.DestinationWarehouseId);
        if (destWarehouse == null)
        {
            throw new KeyNotFoundException($"No se encontró el almacén de destino con ID {dto.DestinationWarehouseId}.");
        }

        var item = await _context.Items.FindAsync(dto.ItemId);
        if (item == null)
        {
            throw new KeyNotFoundException($"No se encontró el artículo con ID {dto.ItemId}.");
        }

        // VALIDACIÓN TRANSACCIONAL ESTRICTA: Bloquear si no hay stock suficiente en el almacén de origen
        var sourceStocks = await _context.InventoryStocks
            .Where(s => s.WarehouseId == dto.SourceWarehouseId && s.ItemId == dto.ItemId)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(dto.LotNumber))
        {
            sourceStocks = sourceStocks.Where(s => s.LotNumber == dto.LotNumber).ToList();
        }

        decimal totalAvailable = sourceStocks.Sum(s => s.AvailableQuantity);
        if (totalAvailable < dto.Quantity)
        {
            _logger.LogWarning("Transferencia bloqueada por stock insuficiente en {Source}. Disponible: {Avail}, Requerido: {Req}",
                sourceWarehouse.Code, totalAvailable, dto.Quantity);

            throw new InvalidOperationException(
                $"Bloqueo transaccional: Stock insuficiente en el almacén de origen '{sourceWarehouse.Code} - {sourceWarehouse.Name}'. " +
                $"Stock disponible: {totalAvailable} {item.UnitOfMeasure}, Cantidad solicitada: {dto.Quantity} {item.UnitOfMeasure}. " +
                $"Déficit: {dto.Quantity - totalAvailable} {item.UnitOfMeasure}.");
        }

        // Descontar del almacén de origen
        decimal remainingToDeduct = dto.Quantity;
        string assignedLot = dto.LotNumber ?? string.Empty;

        foreach (var sStock in sourceStocks.OrderBy(s => s.Quantity))
        {
            if (remainingToDeduct <= 0) break;

            decimal deduct = Math.Min(sStock.Quantity, remainingToDeduct);
            sStock.Quantity -= deduct;
            sStock.LastUpdated = DateTime.UtcNow;
            remainingToDeduct -= deduct;

            if (string.IsNullOrEmpty(assignedLot) && !string.IsNullOrEmpty(sStock.LotNumber))
            {
                assignedLot = sStock.LotNumber;
            }
        }

        // Incrementar en almacén de destino
        var destStock = await _context.InventoryStocks
            .FirstOrDefaultAsync(s => s.WarehouseId == dto.DestinationWarehouseId && s.ItemId == dto.ItemId && s.LotNumber == assignedLot);

        if (destStock == null)
        {
            destStock = new InventoryStock
            {
                WarehouseId = dto.DestinationWarehouseId,
                ItemId = dto.ItemId,
                LotNumber = assignedLot,
                Quantity = dto.Quantity,
                LastUpdated = DateTime.UtcNow
            };
            _context.InventoryStocks.Add(destStock);
        }
        else
        {
            destStock.Quantity += dto.Quantity;
            destStock.LastUpdated = DateTime.UtcNow;
        }

        // Registrar transacción inmutable en el Kardex
        string refNumber = !string.IsNullOrWhiteSpace(dto.ReferenceNumber)
            ? dto.ReferenceNumber
            : $"TR-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";

        decimal totalCost = Math.Round(item.Cost * dto.Quantity, 2);

        var tx = new InventoryTransaction
        {
            TransactionDate = DateTime.UtcNow,
            TransactionType = "TRANSFERENCIA",
            ItemId = item.Id,
            SourceWarehouseId = sourceWarehouse.Id,
            DestinationWarehouseId = destWarehouse.Id,
            LotNumber = assignedLot,
            Quantity = dto.Quantity,
            UnitCost = item.Cost,
            TotalCost = totalCost,
            ReferenceNumber = refNumber,
            Notes = dto.Notes ?? $"Transferencia entre almacenes: {sourceWarehouse.Code} -> {destWarehouse.Code}",
            PerformedBy = performedBy ?? "Operador Almacén",
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryTransactions.Add(tx);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Transferencia completada: {Qty} {Uom} de {Item} desde {Src} a {Dst}. Ref: {Ref}",
            dto.Quantity, item.UnitOfMeasure, item.Code, sourceWarehouse.Code, destWarehouse.Code, refNumber);

        return new InventoryTransactionResponseDto
        {
            Id = tx.Id,
            TransactionDate = tx.TransactionDate,
            TransactionType = tx.TransactionType,
            ItemId = item.Id,
            ItemCode = item.Code,
            ItemName = item.Name,
            Category = item.Category,
            SourceWarehouseId = sourceWarehouse.Id,
            SourceWarehouseCode = sourceWarehouse.Code,
            SourceWarehouseName = sourceWarehouse.Name,
            DestinationWarehouseId = destWarehouse.Id,
            DestinationWarehouseCode = destWarehouse.Code,
            DestinationWarehouseName = destWarehouse.Name,
            LotNumber = assignedLot,
            Quantity = tx.Quantity,
            UnitOfMeasure = item.UnitOfMeasure,
            UnitCost = tx.UnitCost,
            TotalCost = tx.TotalCost,
            ReferenceNumber = tx.ReferenceNumber,
            Notes = tx.Notes,
            PerformedBy = tx.PerformedBy,
            CreatedAt = tx.CreatedAt
        };
    }

    public async Task<InventoryTransactionResponseDto> AdjustStockAsync(AdjustStockRequestDto dto, string? performedBy)
    {
        if (dto.Quantity <= 0)
        {
            throw new ArgumentException("La cantidad del ajuste debe ser mayor a cero.", nameof(dto.Quantity));
        }

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
        if (warehouse == null)
        {
            throw new KeyNotFoundException($"No se encontró el almacén con ID {dto.WarehouseId}.");
        }

        var item = await _context.Items.FindAsync(dto.ItemId);
        if (item == null)
        {
            throw new KeyNotFoundException($"No se encontró el artículo con ID {dto.ItemId}.");
        }

        bool isSalida = dto.AdjustmentType.ToUpper() == "SALIDA";
        string lot = dto.LotNumber ?? string.Empty;

        var stock = await _context.InventoryStocks
            .FirstOrDefaultAsync(s => s.WarehouseId == dto.WarehouseId && s.ItemId == dto.ItemId && s.LotNumber == lot);

        if (isSalida)
        {
            decimal available = stock?.AvailableQuantity ?? 0m;
            if (available < dto.Quantity)
            {
                _logger.LogWarning("Ajuste de salida bloqueado por stock insuficiente en {Warehouse}. Disponible: {Avail}, Requerido: {Req}",
                    warehouse.Code, available, dto.Quantity);

                throw new InvalidOperationException(
                    $"Bloqueo transaccional: No es posible registrar una salida de ajuste mayor al stock existente. " +
                    $"Stock disponible en {warehouse.Code}: {available} {item.UnitOfMeasure}, Salida solicitada: {dto.Quantity} {item.UnitOfMeasure}.");
            }

            stock!.Quantity -= dto.Quantity;
            stock.LastUpdated = DateTime.UtcNow;
        }
        else
        {
            if (stock == null)
            {
                stock = new InventoryStock
                {
                    WarehouseId = dto.WarehouseId,
                    ItemId = dto.ItemId,
                    LotNumber = lot,
                    Quantity = dto.Quantity,
                    LastUpdated = DateTime.UtcNow
                };
                _context.InventoryStocks.Add(stock);
            }
            else
            {
                stock.Quantity += dto.Quantity;
                stock.LastUpdated = DateTime.UtcNow;
            }
        }

        decimal totalCost = Math.Round(item.Cost * dto.Quantity, 2);
        string refNumber = $"AJ-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";

        var tx = new InventoryTransaction
        {
            TransactionDate = DateTime.UtcNow,
            TransactionType = isSalida ? "AJUSTE_NEGATIVO" : "AJUSTE_POSITIVO",
            ItemId = item.Id,
            SourceWarehouseId = isSalida ? warehouse.Id : null,
            DestinationWarehouseId = isSalida ? null : warehouse.Id,
            LotNumber = lot,
            Quantity = dto.Quantity,
            UnitCost = item.Cost,
            TotalCost = totalCost,
            ReferenceNumber = refNumber,
            Notes = dto.Reason ?? $"Ajuste manual de inventario ({dto.AdjustmentType})",
            PerformedBy = performedBy ?? "Control de Calidad / Almacén",
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryTransactions.Add(tx);
        await _context.SaveChangesAsync();

        return new InventoryTransactionResponseDto
        {
            Id = tx.Id,
            TransactionDate = tx.TransactionDate,
            TransactionType = tx.TransactionType,
            ItemId = item.Id,
            ItemCode = item.Code,
            ItemName = item.Name,
            Category = item.Category,
            SourceWarehouseId = tx.SourceWarehouseId,
            SourceWarehouseCode = isSalida ? warehouse.Code : null,
            SourceWarehouseName = isSalida ? warehouse.Name : null,
            DestinationWarehouseId = tx.DestinationWarehouseId,
            DestinationWarehouseCode = !isSalida ? warehouse.Code : null,
            DestinationWarehouseName = !isSalida ? warehouse.Name : null,
            LotNumber = lot,
            Quantity = tx.Quantity,
            UnitOfMeasure = item.UnitOfMeasure,
            UnitCost = tx.UnitCost,
            TotalCost = tx.TotalCost,
            ReferenceNumber = tx.ReferenceNumber,
            Notes = tx.Notes,
            PerformedBy = tx.PerformedBy,
            CreatedAt = tx.CreatedAt
        };
    }
}
