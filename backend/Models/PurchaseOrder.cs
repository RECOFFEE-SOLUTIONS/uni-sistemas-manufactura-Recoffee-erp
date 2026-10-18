using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class PurchaseOrder
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty; // Ej: OC-2026-0001

    [Required]
    public int SupplierId { get; set; }

    [ForeignKey(nameof(SupplierId))]
    public Supplier? Supplier { get; set; }

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    public DateTime? ExpectedDeliveryDate { get; set; }

    public DateTime? ReceivedDate { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Emitida"; // Emitida, Recibida, Cancelada

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PurchaseOrderLine> Lines { get; set; } = new List<PurchaseOrderLine>();
}
