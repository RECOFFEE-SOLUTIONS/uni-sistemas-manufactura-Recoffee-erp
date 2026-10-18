using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class RoutingOperation
{
    public int Id { get; set; }

    [Required]
    public int RoutingHeaderId { get; set; }

    [ForeignKey(nameof(RoutingHeaderId))]
    public RoutingHeader? RoutingHeader { get; set; }

    public int SequenceOrder { get; set; }

    [Required]
    [MaxLength(20)]
    public string OperationCode { get; set; } = string.Empty; // RO-1, RO-2, etc.

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(100)]
    public string WorkCenter { get; set; } = string.Empty;

    // Diferenciación explícita de tiempos (horas / minutos manuales vs máquina vs proceso pasivo)
    [Column(TypeName = "decimal(18,2)")]
    public decimal LaborMinutes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MachineMinutes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PassiveProcessMinutes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SetupMinutes { get; set; }

    public bool IsQualityCheck { get; set; } = false;

    public bool RequiresIIoTTelemetry { get; set; } = false;

    [MaxLength(250)]
    public string? StandardInstructions { get; set; }
}
