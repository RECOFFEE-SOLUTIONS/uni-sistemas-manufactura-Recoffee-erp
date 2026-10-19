using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class IiotTelemetryLog
{
    public int Id { get; set; }

    public int? ProductionOrderId { get; set; }

    [ForeignKey(nameof(ProductionOrderId))]
    public ProductionOrder? ProductionOrder { get; set; }

    [Required]
    [MaxLength(100)]
    public string LotNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string OperationCode { get; set; } = "RO-3";

    [Required]
    [MaxLength(50)]
    public string SensorId { get; set; } = "SENSOR-RO3-SOLAR-01";

    [Column(TypeName = "decimal(18,2)")]
    public decimal TemperatureCelsius { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MoisturePercent { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
