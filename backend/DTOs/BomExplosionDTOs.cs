namespace backend.DTOs;

public class BomExplosionItemDto
{
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal RequiredQuantity { get; set; }
    public decimal ScrapPercentage { get; set; }
    public decimal GrossQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public int Level { get; set; }
}

public class BomTreeNodeDto
{
    public int ItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal RequiredQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal ScrapPercentage { get; set; }
    public decimal GrossQuantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal SubtotalCost { get; set; }
    public int Level { get; set; }
    public string? BomCode { get; set; }
    public bool IsSubassembly { get; set; }
    public List<BomTreeNodeDto> Children { get; set; } = new();
}

public class BomExplosionResponseDto
{
    public int ParentItemId { get; set; }
    public string ParentItemCode { get; set; } = string.Empty;
    public string ParentItemName { get; set; } = string.Empty;
    public string ParentCategory { get; set; } = string.Empty;
    public decimal RequestedQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public string BomCode { get; set; } = string.Empty;
    public string BomVersion { get; set; } = string.Empty;
    public decimal BomBaseQuantity { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public DateTime CalculationTimestamp { get; set; } = DateTime.UtcNow;

    // Resumen consolidado plano de materias primas e insumos terminales
    public List<BomExplosionItemDto> ConsolidatedMaterials { get; set; } = new();

    // Estructura jerárquica multinivel
    public BomTreeNodeDto ExplosionTree { get; set; } = new();
}

public class BomHeaderSummaryDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int ParentItemId { get; set; }
    public string ParentItemCode { get; set; } = string.Empty;
    public string ParentItemName { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BaseQuantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int ComponentsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
