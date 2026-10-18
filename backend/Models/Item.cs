using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Item
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty; // MP, EMP, SEM, PT

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasure { get; set; } = "kg";

    [Column(TypeName = "decimal(18,4)")]
    public decimal Cost { get; set; } = 0.0m;

    [Column(TypeName = "decimal(18,4)")]
    public decimal StandardCost { get; set; } = 0.0m;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
