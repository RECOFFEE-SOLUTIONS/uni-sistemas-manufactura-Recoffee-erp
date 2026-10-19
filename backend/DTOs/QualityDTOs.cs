namespace backend.DTOs;

public class CreateQualityInspectionDto
{
    public string LotNumber { get; set; } = string.Empty;
    public int? ProductionOrderId { get; set; }
    public int? ProductionOrderOperationId { get; set; }
    public int? ItemId { get; set; }
    public string? InspectorName { get; set; }

    // Parámetros técnicos a validar
    public decimal HumidityPercentage { get; set; } // Estándar: 15.00% a 25.00%
    public decimal WeightKg { get; set; } // Estándar: 5.00 kg

    public string? Appearance { get; set; }
    public decimal? Ph { get; set; }
    public string? Notes { get; set; }
    public string? ProposedActionIfRejected { get; set; } // Retrabajo, Scrap, Reinspección
}

public class QualityInspectionResponseDto
{
    public int Id { get; set; }
    public string InspectionCode { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public int? ProductionOrderId { get; set; }
    public string? ProductionOrderNumber { get; set; }
    public int? ProductionOrderOperationId { get; set; }
    public string? OperationCode { get; set; }
    public int? ItemId { get; set; }
    public string? ItemCode { get; set; }
    public string? ItemName { get; set; }
    public DateTime InspectionDate { get; set; }
    public string InspectorName { get; set; } = string.Empty;

    // Parámetros técnicos
    public decimal HumidityPercentage { get; set; }
    public decimal WeightKg { get; set; }
    public string? Appearance { get; set; }
    public decimal? Ph { get; set; }

    // Evaluación y No Conformidad
    public string Status { get; set; } = string.Empty; // Aprobado, Rechazado
    public bool HasNonConformance { get; set; }
    public string? NonConformanceReason { get; set; }
    public string? Notes { get; set; }
    public int? NcrId { get; set; }
    public string? NcrNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class NonConformanceReportResponseDto
{
    public int Id { get; set; }
    public string NcrNumber { get; set; } = string.Empty;
    public int QualityInspectionId { get; set; }
    public string InspectionCode { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public int? ProductionOrderId { get; set; }
    public string? ProductionOrderNumber { get; set; }
    public DateTime ReportDate { get; set; }
    public string Severity { get; set; } = string.Empty; // Menor, Mayor, Crítica
    public string DefectDescription { get; set; } = string.Empty;
    public string? HumidityDeviation { get; set; }
    public string? WeightDeviation { get; set; }
    public string? RootCause { get; set; }
    public string ProposedAction { get; set; } = string.Empty; // Retrabajo, Scrap, etc.
    public string Status { get; set; } = string.Empty; // Abierto, En Tratamiento, Cerrado
    public string? ResponsiblePerson { get; set; }
    public string? ResolutionNotes { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CloseNcrRequestDto
{
    public string ResolutionNotes { get; set; } = string.Empty;
    public string? ResponsiblePerson { get; set; }
    public string? ActionTaken { get; set; }
}
