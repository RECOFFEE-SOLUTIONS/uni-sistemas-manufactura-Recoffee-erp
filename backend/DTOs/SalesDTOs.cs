namespace backend.DTOs;

public class CreateSalesOrderLineDto
{
    public int ItemId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? UnitOfMeasure { get; set; }
}

public class CreateSalesOrderDto
{
    public int CustomerId { get; set; }
    public string? OrderNumber { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateSalesOrderLineDto> Lines { get; set; } = new();
}

public class DispatchSalesOrderDto
{
    public DateTime? DispatchDate { get; set; }
    public string? Notes { get; set; }
}

public class SalesOrderLineResponseDto
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
    public decimal DispatchedQuantity { get; set; }
    public bool IsDispatched { get; set; }
    public string? AssignedLotNumber { get; set; }
}

public class SalesOrderResponseDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public DateTime? DispatchedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public int LinesCount { get; set; }
    public List<SalesOrderLineResponseDto> Lines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class DispatchedLotAllocationDto
{
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public decimal AllocatedQuantity { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
}

public class DispatchSalesOrderResultDto
{
    public int SalesOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime DispatchedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalDispatchedQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public string WarehouseCode { get; set; } = "ALM-003";
    public List<DispatchedLotAllocationDto> AllocatedLots { get; set; } = new();
    public decimal RemainingStockInWarehouse { get; set; }
    public string Message { get; set; } = string.Empty;
}
