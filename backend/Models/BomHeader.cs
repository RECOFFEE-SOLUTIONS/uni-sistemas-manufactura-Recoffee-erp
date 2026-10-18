using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class BomHeader
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public int ParentItemId { get; set; }

    [ForeignKey(nameof(ParentItemId))]
    public Item? ParentItem { get; set; }

    [Required]
    [MaxLength(20)]
    public string Version { get; set; } = "v1.0";

    [MaxLength(250)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal BaseQuantity { get; set; } = 1.0m;

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasure { get; set; } = "unidad";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BomComponent> Components { get; set; } = new List<BomComponent>();
}
