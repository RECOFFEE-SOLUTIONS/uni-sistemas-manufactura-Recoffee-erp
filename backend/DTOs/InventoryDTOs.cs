namespace backend.DTOs;

public class InventoryStockResponseDto
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal AvailableQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal TotalValue { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class InventoryStockSummaryDto
{
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal TotalPhysicalQuantity { get; set; }
    public decimal TotalReservedQuantity { get; set; }
    public decimal TotalAvailableQuantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalValuation { get; set; }
    public List<InventoryStockResponseDto> WarehouseBalances { get; set; } = new();
}

public class InventoryTransactionResponseDto
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int? SourceWarehouseId { get; set; }
    public string? SourceWarehouseCode { get; set; }
    public string? SourceWarehouseName { get; set; }
    public int? DestinationWarehouseId { get; set; }
    public string? DestinationWarehouseCode { get; set; }
    public string? DestinationWarehouseName { get; set; }
    public string? LotNumber { get; set; }
    public decimal Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public string? PerformedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TransferStockRequestDto
{
    public int ItemId { get; set; }
    public int SourceWarehouseId { get; set; }
    public int DestinationWarehouseId { get; set; }
    public string? LotNumber { get; set; }
    public decimal Quantity { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class AdjustStockRequestDto
{
    public int ItemId { get; set; }
    public int WarehouseId { get; set; }
    public string? LotNumber { get; set; }
    public decimal Quantity { get; set; }
    public string AdjustmentType { get; set; } = "ENTRADA"; // ENTRADA o SALIDA
    public string? Reason { get; set; }
}
