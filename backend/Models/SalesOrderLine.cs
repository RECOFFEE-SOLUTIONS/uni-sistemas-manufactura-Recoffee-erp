using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class SalesOrderLine
{
    public int Id { get; set; }

    [Required]
    public int SalesOrderId { get; set; }

    [ForeignKey(nameof(SalesOrderId))]
    public SalesOrder? SalesOrder { get; set; }

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
    public string UnitOfMeasure { get; set; } = "bolsa";

    [Column(TypeName = "decimal(18,4)")]
    public decimal DispatchedQuantity { get; set; } = 0m;

    public bool IsDispatched { get; set; } = false;

    [MaxLength(100)]
    public string? AssignedLotNumber { get; set; } // Lote seleccionado por FIFO al despachar
}
