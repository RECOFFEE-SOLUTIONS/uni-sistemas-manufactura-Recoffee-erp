using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class QualityInspection
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string InspectionCode { get; set; } = string.Empty; // INS-20261018-0001

    [Required]
    [MaxLength(100)]
    public string LotNumber { get; set; } = string.Empty;

    public int? ProductionOrderId { get; set; }

    [ForeignKey(nameof(ProductionOrderId))]
    public ProductionOrder? ProductionOrder { get; set; }

    public int? ProductionOrderOperationId { get; set; }

    [ForeignKey(nameof(ProductionOrderOperationId))]
    public ProductionOrderOperation? ProductionOrderOperation { get; set; } // Enlazada a RO-5

    public int? ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    public DateTime InspectionDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(100)]
    public string InspectorName { get; set; } = string.Empty;

    // Parámetros técnicos específicos de ReCoffee Solutions
    [Column(TypeName = "decimal(18,2)")]
    public decimal HumidityPercentage { get; set; } // Rango aceptable: 15.00% a 25.00%

    [Column(TypeName = "decimal(18,2)")]
    public decimal WeightKg { get; set; } // Peso objetivo: 5.00 kg por bolsa

    [MaxLength(250)]
    public string? Appearance { get; set; } = "Color café oscuro homogéneo, textura granulada fina.";

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Ph { get; set; } = 6.5m; // pH óptimo neutro-ácido

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Aprobado"; // Aprobado, Rechazado

    public bool HasNonConformance { get; set; } = false;

    [MaxLength(500)]
    public string? NonConformanceReason { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public NonConformanceReport? NonConformanceReport { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
