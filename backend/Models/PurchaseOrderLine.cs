using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class PurchaseOrderLine
{
    public int Id { get; set; }

    [Required]
    public int PurchaseOrderId { get; set; }

    [ForeignKey(nameof(PurchaseOrderId))]
    public PurchaseOrder? PurchaseOrder { get; set; }

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasure { get; set; } = "kg";

    [Column(TypeName = "decimal(18,4)")]
    public decimal ReceivedQuantity { get; set; } = 0m;

    public bool IsReceived { get; set; } = false;

    [MaxLength(100)]
    public string? GeneratedLotNumber { get; set; }
}
