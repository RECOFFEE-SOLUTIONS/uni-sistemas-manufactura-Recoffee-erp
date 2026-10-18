using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class ProductionOrderOperation
{
    public int Id { get; set; }

    [Required]
    public int ProductionOrderId { get; set; }

    [ForeignKey(nameof(ProductionOrderId))]
    public ProductionOrder? ProductionOrder { get; set; }

    public int? RoutingOperationId { get; set; }

    [ForeignKey(nameof(RoutingOperationId))]
    public RoutingOperation? RoutingOperation { get; set; }

    public int SequenceOrder { get; set; } // 1 a 8

    [Required]
    [MaxLength(20)]
    public string OperationCode { get; set; } = string.Empty; // RO-1 a RO-8

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string WorkCenter { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Pendiente"; // Pendiente, Iniciado, Completado, Pausado

    // Tiempos Estándar de la Hoja de Ruta
    [Column(TypeName = "decimal(18,2)")]
    public decimal StandardLaborMinutes { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal StandardMachineMinutes { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal StandardPassiveMinutes { get; set; } = 0m;

    // Tiempos Reales de Piso de Planta (Timestamp)
    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualLaborMinutes { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualMachineMinutes { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualPassiveMinutes { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalActualMinutes { get; set; } = 0m;

    public bool IsQualityCheck { get; set; } = false;

    public bool RequiresIIoTTelemetry { get; set; } = false;

    [MaxLength(100)]
    public string? ExecutedBy { get; set; } // Operario que ejecutó o inició el paso

    [MaxLength(500)]
    public string? OperatorNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
