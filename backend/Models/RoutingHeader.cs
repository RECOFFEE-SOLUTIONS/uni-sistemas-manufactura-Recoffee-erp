using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class RoutingHeader
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public Item? Item { get; set; }

    [Required]
    [MaxLength(20)]
    public string Version { get; set; } = "v1.0";

    [MaxLength(250)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalLaborMinutes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalMachineMinutes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPassiveProcessMinutes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCycleMinutes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RoutingOperation> Operations { get; set; } = new List<RoutingOperation>();
}
