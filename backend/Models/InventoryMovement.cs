using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class InventoryMovement
{
    public int Id { get; set; }

    public DateTime MovementDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string MovementType { get; set; } = string.Empty; // RECEPCION_COMPRA, CONSUMO_PRODUCCION, ENTRADA_PRODUCCION, DESPACHO_VENTA, AJUSTE

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Required]
    public int WarehouseId { get; set; }

    [ForeignKey(nameof(WarehouseId))]
    public Warehouse? Warehouse { get; set; }

    [MaxLength(100)]
    public string? LotNumber { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCost { get; set; }

    [MaxLength(50)]
    public string? ReferenceNumber { get; set; } // Ej: OC-2026-0001, OP-2026-0001

    [MaxLength(250)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
