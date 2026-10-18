using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class InventoryLot
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string LotNumber { get; set; } = string.Empty; // Ej: LOTE-MP-001-20261018-0001

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Required]
    public int WarehouseId { get; set; }

    [ForeignKey(nameof(WarehouseId))]
    public Warehouse? Warehouse { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal InitialQuantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal CurrentQuantity { get; set; }

    public int? PurchaseOrderId { get; set; }

    [ForeignKey(nameof(PurchaseOrderId))]
    public PurchaseOrder? PurchaseOrder { get; set; }

    public DateTime EntryDate { get; set; } = DateTime.UtcNow;

    public DateTime? ExpirationDate { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Disponible"; // Disponible, Agotado, Cuarentena

    [MaxLength(250)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
