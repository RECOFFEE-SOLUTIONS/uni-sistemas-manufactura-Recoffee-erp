namespace backend.DTOs;

public class CreatePurchaseOrderLineDto
{
    public int ItemId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? UnitOfMeasure { get; set; }
}

public class CreatePurchaseOrderDto
{
    public int SupplierId { get; set; }
    public string? OrderNumber { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Notes { get; set; }
    public List<CreatePurchaseOrderLineDto> Lines { get; set; } = new();
}

public class ReceivePurchaseOrderDto
{
    public DateTime? ReceptionDate { get; set; }
    public string? Notes { get; set; }
}

public class PurchaseOrderLineResponseDto
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal ReceivedQuantity { get; set; }
    public bool IsReceived { get; set; }
    public string? GeneratedLotNumber { get; set; }
}

public class PurchaseOrderResponseDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public string SupplierCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public int LinesCount { get; set; }
    public List<PurchaseOrderLineResponseDto> Lines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class GeneratedLotSummaryDto
{
    public string LotNumber { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public decimal QuantityReceived { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal NewStockBalance { get; set; }
}

public class PurchaseReceptionResultDto
{
    public int PurchaseOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime ReceivedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<GeneratedLotSummaryDto> GeneratedLots { get; set; } = new();
}
