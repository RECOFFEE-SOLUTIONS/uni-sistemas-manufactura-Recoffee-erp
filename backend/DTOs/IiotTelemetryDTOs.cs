namespace backend.DTOs;

public class IiotTelemetryPayloadDto
{
    public int? ProductionOrderId { get; set; }
    public string? LotNumber { get; set; }
    public string? OperationCode { get; set; } // RO-3
    public string? WorkCenter { get; set; }
    public string? Operation { get; set; }
    public string? SensorId { get; set; } // SENSOR-RO3-SOLAR-01
    public decimal TemperatureCelsius { get; set; }
    public decimal? Temperature { get; set; }
    public decimal MoisturePercent { get; set; }
    public decimal? Moisture { get; set; }
    public DateTime? Timestamp { get; set; }
    public int? Step { get; set; }
    public int? TotalSteps { get; set; }
}

public class IiotTelemetryResponseDto
{
    public int Id { get; set; }
    public int? ProductionOrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string LotNumber { get; set; } = string.Empty;
    public string OperationCode { get; set; } = string.Empty;
    public string SensorId { get; set; } = string.Empty;
    public decimal TemperatureCelsius { get; set; }
    public decimal MoisturePercent { get; set; }
    public DateTime Timestamp { get; set; }
    public bool IsTargetMoistureAchieved { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class IiotBatchTelemetryResponseDto
{
    public int ReceivedCount { get; set; }
    public string LotNumber { get; set; } = string.Empty;
    public decimal LatestMoisture { get; set; }
    public decimal LatestTemperature { get; set; }
    public bool IsTargetMoistureAchieved { get; set; }
    public string Message { get; set; } = string.Empty;
}
