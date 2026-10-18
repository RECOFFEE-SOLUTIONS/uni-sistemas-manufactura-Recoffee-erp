namespace backend.DTOs;

public class CreateProductionOrderDto
{
    public int ItemId { get; set; }
    public decimal PlannedQuantity { get; set; }
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public string? Notes { get; set; }
}

public class ProductionOrderMaterialResponseDto
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal RequiredQuantity { get; set; }
    public decimal ConsumedQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public int? SourceWarehouseId { get; set; }
    public string? SourceWarehouseCode { get; set; }
    public string? SourceWarehouseName { get; set; }
    public int? WipWarehouseId { get; set; }
    public string? WipWarehouseCode { get; set; }
    public string? WipWarehouseName { get; set; }
    public string? LotNumber { get; set; }
    public bool IsConsumed { get; set; }
    public DateTime? ConsumedAt { get; set; }
}

public class ProductionOrderResponseDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int? BomHeaderId { get; set; }
    public string? BomCode { get; set; }
    public string? BomVersion { get; set; }
    public int? RoutingHeaderId { get; set; }
    public string? RoutingCode { get; set; }
    public decimal PlannedQuantity { get; set; }
    public decimal ProducedQuantity { get; set; }
    public decimal ScrapQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public DateTime PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? LotNumber { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public decimal TotalActualCost { get; set; }
    public string? Notes { get; set; }
    public int MaterialsCount { get; set; }
    public List<ProductionOrderMaterialResponseDto> Materials { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class WipTransferDetailDto
{
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string SourceWarehouseCode { get; set; } = string.Empty;
    public string WipWarehouseCode { get; set; } = string.Empty;
    public decimal QuantityTransferred { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public string? LotNumber { get; set; }
}

public class StartProductionOrderResultDto
{
    public int ProductionOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ActualStartDate { get; set; }
    public string OutputLotNumber { get; set; } = string.Empty;
    public int TotalMaterialsConsumed { get; set; }
    public decimal TotalWipCost { get; set; }
    public List<WipTransferDetailDto> TransferredMaterials { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
