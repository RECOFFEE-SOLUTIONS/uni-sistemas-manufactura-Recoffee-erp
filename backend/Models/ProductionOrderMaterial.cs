using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class ProductionOrderMaterial
{
    public int Id { get; set; }

    [Required]
    public int ProductionOrderId { get; set; }

    [ForeignKey(nameof(ProductionOrderId))]
    public ProductionOrder? ProductionOrder { get; set; }

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RequiredQuantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ConsumedQuantity { get; set; } = 0m;

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasure { get; set; } = "kg";

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCost { get; set; }

    public int? SourceWarehouseId { get; set; }

    [ForeignKey(nameof(SourceWarehouseId))]
    public Warehouse? SourceWarehouse { get; set; }

    public int? WipWarehouseId { get; set; }

    [ForeignKey(nameof(WipWarehouseId))]
    public Warehouse? WipWarehouse { get; set; }

    [MaxLength(100)]
    public string? LotNumber { get; set; }

    public bool IsConsumed { get; set; } = false;

    public DateTime? ConsumedAt { get; set; }
}
