using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class NonConformanceReport
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string NcrNumber { get; set; } = string.Empty; // NCR-20261018-0001

    [Required]
    public int QualityInspectionId { get; set; }

    [ForeignKey(nameof(QualityInspectionId))]
    public QualityInspection? QualityInspection { get; set; }

    [Required]
    [MaxLength(100)]
    public string LotNumber { get; set; } = string.Empty;

    public int? ProductionOrderId { get; set; }

    [ForeignKey(nameof(ProductionOrderId))]
    public ProductionOrder? ProductionOrder { get; set; }

    public DateTime ReportDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(30)]
    public string Severity { get; set; } = "Mayor"; // Menor, Mayor, Crítica

    [Required]
    [MaxLength(500)]
    public string DefectDescription { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? HumidityDeviation { get; set; }

    [MaxLength(250)]
    public string? WeightDeviation { get; set; }

    [MaxLength(500)]
    public string? RootCause { get; set; }

    [Required]
    [MaxLength(500)]
    public string ProposedAction { get; set; } = "Retrabajo"; // Retrabajo, Scrap, Reinspección

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Abierto"; // Abierto, En Tratamiento, Cerrado

    [MaxLength(100)]
    public string? ResponsiblePerson { get; set; }

    [MaxLength(500)]
    public string? ResolutionNotes { get; set; }

    public DateTime? ClosedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
