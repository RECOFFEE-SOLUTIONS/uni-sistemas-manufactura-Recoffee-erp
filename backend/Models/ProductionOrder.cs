using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class ProductionOrder
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty; // Ej: OP-2026-0001

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    public int? BomHeaderId { get; set; }

    [ForeignKey(nameof(BomHeaderId))]
    public BomHeader? BomHeader { get; set; }

    public int? RoutingHeaderId { get; set; }

    [ForeignKey(nameof(RoutingHeaderId))]
    public RoutingHeader? RoutingHeader { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PlannedQuantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ProducedQuantity { get; set; } = 0m;

    [Column(TypeName = "decimal(18,4)")]
    public decimal ScrapQuantity { get; set; } = 0m;

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasure { get; set; } = "bolsa";

    public DateTime PlannedStartDate { get; set; } = DateTime.UtcNow;

    public DateTime? PlannedEndDate { get; set; }

    public DateTime? ActualStartDate { get; set; }

    public DateTime? ActualEndDate { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Planificada"; // Planificada, En Proceso, Completada, Cancelada

    [MaxLength(100)]
    public string? LotNumber { get; set; } // Lote que identificará el producto terminado

    [MaxLength(500)]
    public string? Notes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalEstimatedCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalActualCost { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProductionOrderMaterial> Materials { get; set; } = new List<ProductionOrderMaterial>();
}
