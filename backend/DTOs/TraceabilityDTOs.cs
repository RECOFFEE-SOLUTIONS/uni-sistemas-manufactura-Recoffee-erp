namespace backend.DTOs;

public class TraceabilityProductionOrderDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal PlannedQuantity { get; set; }
    public decimal ProducedQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public decimal TotalActualCost { get; set; }
    public string? BomCode { get; set; }
    public string? RoutingCode { get; set; }
}

public class TraceabilityUpstreamItemDto
{
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal ConsumedQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public string SourceWarehouseCode { get; set; } = string.Empty;
    public int? PurchaseOrderId { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public DateTime? PurchaseOrderDate { get; set; }
    public DateTime? ReceptionDate { get; set; }
    public int? SupplierId { get; set; }
    public string? SupplierCode { get; set; }
    public string? SupplierName { get; set; }
    public string? SupplierContact { get; set; }
}

public class TraceabilityDownstreamItemDto
{
    public int SalesOrderId { get; set; }
    public string SalesOrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerAddress { get; set; }
    public string? CustomerContact { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? DispatchedDate { get; set; }
    public decimal DispatchedQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string AssignedLot { get; set; } = string.Empty;
}

public class TraceabilityKardexEntryDto
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string? SourceWarehouseCode { get; set; }
    public string? DestinationWarehouseCode { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public string? PerformedBy { get; set; }
}

public class LotTraceabilityResponseDto
{
    public string LotNumber { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int? WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public decimal InitialQuantity { get; set; }
    public decimal CurrentQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string LotType { get; set; } = string.Empty; // Producto Terminado, Materia Prima, Insumo de Empaque
    public TraceabilityProductionOrderDto? ProductionOrder { get; set; }
    public List<TraceabilityUpstreamItemDto> Upstream { get; set; } = new();
    public List<TraceabilityDownstreamItemDto> Downstream { get; set; } = new();
    public List<TraceabilityKardexEntryDto> KardexTimeline { get; set; } = new();
}

public class TraceableLotSummaryDto
{
    public string LotNumber { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string WarehouseCode { get; set; } = string.Empty;
    public decimal CurrentQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
