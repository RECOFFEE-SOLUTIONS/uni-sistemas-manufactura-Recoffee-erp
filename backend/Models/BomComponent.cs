using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class BomComponent
{
    public int Id { get; set; }

    [Required]
    public int BomHeaderId { get; set; }

    [ForeignKey(nameof(BomHeaderId))]
    public BomHeader? BomHeader { get; set; }

    [Required]
    public int ComponentItemId { get; set; }

    [ForeignKey(nameof(ComponentItemId))]
    public Item? ComponentItem { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasure { get; set; } = "kg";

    [Column(TypeName = "decimal(18,4)")]
    public decimal ScrapPercentage { get; set; } = 0.0m;

    public int Level { get; set; } = 1;

    [MaxLength(250)]
    public string? Notes { get; set; }
}
