namespace backend.DTOs;

public class StartOperationRequestDto
{
    public string? OperatorName { get; set; }
    public string? Notes { get; set; }
    public DateTime? StartedAt { get; set; }
}

public class CompleteOperationRequestDto
{
    public string? OperatorName { get; set; }
    public string? Notes { get; set; }
    public decimal? ActualLaborMinutes { get; set; }
    public decimal? ActualMachineMinutes { get; set; }
    public decimal? ActualPassiveMinutes { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class ProductionOrderOperationResponseDto
{
    public int Id { get; set; }
    public int ProductionOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int? RoutingOperationId { get; set; }
    public int SequenceOrder { get; set; }
    public string OperationCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string WorkCenter { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Pendiente, Iniciado, Completado, Pausado

    // Tiempos Estándar
    public decimal StandardLaborMinutes { get; set; }
    public decimal StandardMachineMinutes { get; set; }
    public decimal StandardPassiveMinutes { get; set; }
    public decimal StandardTotalMinutes => StandardLaborMinutes + StandardMachineMinutes + StandardPassiveMinutes;

    // Tiempos Reales de Piso de Planta
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal ActualLaborMinutes { get; set; }
    public decimal ActualMachineMinutes { get; set; }
    public decimal ActualPassiveMinutes { get; set; }
    public decimal TotalActualMinutes { get; set; }

    public bool IsQualityCheck { get; set; }
    public bool RequiresIIoTTelemetry { get; set; }
    public string? ExecutedBy { get; set; }
    public string? OperatorNotes { get; set; }
}

public class ProductionOrderMesDetailDto
{
    public int ProductionOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal PlannedQuantity { get; set; }
    public decimal ProducedQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? LotNumber { get; set; }
    public DateTime PlannedStartDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public int TotalOperationsCount { get; set; }
    public int CompletedOperationsCount { get; set; }
    public decimal ProgressPercentage { get; set; }
    public List<ProductionOrderOperationResponseDto> Operations { get; set; } = new();
}
