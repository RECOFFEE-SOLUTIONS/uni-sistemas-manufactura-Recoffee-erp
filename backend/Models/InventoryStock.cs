using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class InventoryStock
{
    public int Id { get; set; }

    [Required]
    public int WarehouseId { get; set; }

    [ForeignKey(nameof(WarehouseId))]
    public Warehouse? Warehouse { get; set; }

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Required]
    [MaxLength(100)]
    public string LotNumber { get; set; } = string.Empty; // Balance físico agrupado por artículo, almacén y lote

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal ReservedQuantity { get; set; } = 0m;

    [NotMapped]
    public decimal AvailableQuantity => Math.Max(0m, Quantity - ReservedQuantity);

    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
