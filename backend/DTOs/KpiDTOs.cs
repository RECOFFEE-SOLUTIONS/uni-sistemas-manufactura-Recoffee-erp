namespace backend.DTOs;

// 1. KPI: Yield / Rendimiento de Calidad
public class LotYieldDto
{
    public int ProductionOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal PlannedQuantity { get; set; }
    public decimal ProducedQuantity { get; set; }
    public decimal ScrapQuantity { get; set; }
    public decimal TotalUnits { get; set; }
    public decimal YieldPercent { get; set; }
    public decimal ScrapPercent { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class YieldKpiResponseDto
{
    public decimal OverallYieldPercent { get; set; }
    public decimal OverallScrapPercent { get; set; }
    public decimal TotalPlannedUnits { get; set; }
    public decimal TotalProducedUnits { get; set; }
    public decimal TotalScrappedUnits { get; set; }
    public int TotalInspectionsCount { get; set; }
    public int ApprovedInspectionsCount { get; set; }
    public int RejectedInspectionsCount { get; set; }
    public decimal InspectionApprovalRate { get; set; }
    public int ActiveNcrsCount { get; set; }
    public List<LotYieldDto> LotDetails { get; set; } = new();
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

// 2. KPI: Costo Unitario Real vs. Estándar
public class LotCostComparisonDto
{
    public int ProductionOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal ProducedQuantity { get; set; }
    public decimal TotalActualCost { get; set; }
    public decimal ActualUnitCost { get; set; }
    public decimal StandardUnitCost { get; set; }
    public decimal Variance { get; set; } // Actual - Standard
    public decimal VariancePercent { get; set; }
    public bool IsFavorable { get; set; } // Variance <= 0 es favorable (ahorro)
    public DateTime? CompletionDate { get; set; }
}

public class UnitCostKpiResponseDto
{
    public decimal OfficialStandardCost { get; set; } = 90.11m;
    public decimal AverageActualUnitCost { get; set; }
    public decimal OverallCostVariance { get; set; }
    public decimal OverallVariancePercent { get; set; }
    public bool IsOverallFavorable { get; set; }
    public string Currency { get; set; } = "C$ (NIO)";
    public int TotalOrdersEvaluated { get; set; }
    public List<LotCostComparisonDto> LotComparisons { get; set; } = new();
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

// 3. KPI: Rotación de Inventario
public class CategoryInventoryDto
{
    public string Category { get; set; } = string.Empty; // MP, EMP, SEM, PT
    public string CategoryName { get; set; } = string.Empty;
    public decimal CurrentStockValue { get; set; }
    public decimal TotalConsumedOrSoldValue { get; set; }
    public decimal TurnoverRatio { get; set; }
    public decimal DaysOnHand { get; set; }
}

public class InventoryTurnoverKpiResponseDto
{
    public decimal InventoryTurnoverRatio { get; set; } // COGS / Inventario Promedio
    public decimal DaysSalesOfInventory { get; set; } // 365 / Turnover
    public decimal CostOfGoodsSoldCogs { get; set; }
    public decimal TotalCurrentInventoryValue { get; set; }
    public decimal TotalPhysicalUnitsInStock { get; set; }
    public List<CategoryInventoryDto> CategoryBreakdown { get; set; } = new();
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

// 4. KPI: OEE y Tiempos de Ciclo de Rutas
public class OperationCycleTimeDto
{
    public string OperationCode { get; set; } = string.Empty; // RO-1 a RO-8
    public string OperationName { get; set; } = string.Empty;
    public string WorkCenter { get; set; } = string.Empty;
    public decimal StandardLaborMinutes { get; set; }
    public decimal StandardMachineMinutes { get; set; }
    public decimal StandardPassiveMinutes { get; set; }
    public decimal TotalStandardMinutes { get; set; }
    public decimal TotalActualMinutes { get; set; }
    public decimal EfficiencyPercent { get; set; }
    public int ExecutionsCount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class OeeKpiResponseDto
{
    public decimal OverallOeePercent { get; set; } // Disponibilidad * Rendimiento * Calidad
    public decimal AvailabilityPercent { get; set; } // Tiempo Operativo / Tiempo Planificado
    public decimal PerformancePercent { get; set; } // Tiempo Ciclo Teórico / Tiempo Ciclo Real
    public decimal QualityPercent { get; set; } // Piezas Buenas / Total Piezas (Yield)
    public decimal StandardRouteCycleMinutes { get; set; } = 2041.0m; // 121m manual + 1920m pasivo (32h)
    public decimal ActualAverageCycleMinutes { get; set; }
    public List<OperationCycleTimeDto> OperationsCycleBreakdown { get; set; } = new();
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

// 5. Consolidado Ejecutivo de KPIs para Dashboard
public class KpiDashboardSummaryDto
{
    public decimal YieldPercent { get; set; }
    public decimal ScrapPercent { get; set; }
    public decimal StandardUnitCost { get; set; } = 90.11m;
    public decimal ActualUnitCost { get; set; }
    public decimal CostVariance { get; set; }
    public decimal CostVariancePercent { get; set; }
    public decimal InventoryTurnoverRatio { get; set; }
    public decimal DaysSalesOfInventory { get; set; }
    public decimal OeePercent { get; set; }
    public decimal AvailabilityPercent { get; set; }
    public decimal PerformancePercent { get; set; }
    public decimal QualityPercent { get; set; }
    public int TotalProductionOrders { get; set; }
    public int CompletedOrders { get; set; }
    public decimal TotalProducedUnits { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
