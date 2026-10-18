using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class InventoryTransaction
{
    public int Id { get; set; }

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string TransactionType { get; set; } = string.Empty; // ENTRADA_COMPRA, TRANSFERENCIA, SALIDA_PRODUCCION, ENTRADA_PRODUCCION, SALIDA_VENTA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    // Almacén de origen (para salidas y transferencias)
    public int? SourceWarehouseId { get; set; }

    [ForeignKey(nameof(SourceWarehouseId))]
    public Warehouse? SourceWarehouse { get; set; }

    // Almacén de destino (para entradas y transferencias)
    public int? DestinationWarehouseId { get; set; }

    [ForeignKey(nameof(DestinationWarehouseId))]
    public Warehouse? DestinationWarehouse { get; set; }

    [MaxLength(100)]
    public string? LotNumber { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCost { get; set; }

    [MaxLength(100)]
    public string? ReferenceNumber { get; set; } // Ej: OC-2026-0001, TR-2026-0001, OP-2026-0001

    [MaxLength(500)]
    public string? Notes { get; set; }

    [MaxLength(100)]
    public string? PerformedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
