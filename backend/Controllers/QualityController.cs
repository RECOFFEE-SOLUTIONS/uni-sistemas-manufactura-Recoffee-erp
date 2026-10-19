using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QualityController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<QualityController> _logger;

    // Parámetros técnicos oficiales de ReCoffee Solutions
    public const decimal MinAcceptableHumidity = 15.00m; // 15%
    public const decimal MaxAcceptableHumidity = 25.00m; // 25%
    public const decimal TargetWeightKg = 5.00m;         // 5.0 kg
    public const decimal MinAcceptableWeightKg = 4.85m;   // Tolerancia inferior
    public const decimal MaxAcceptableWeightKg = 5.15m;   // Tolerancia superior

    public QualityController(ReCoffeeDbContext context, ILogger<QualityController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lista el historial de inspecciones de calidad realizadas.
    /// </summary>
    [HttpGet("inspections")]
    public async Task<ActionResult<IEnumerable<QualityInspectionResponseDto>>> GetInspections(
        [FromQuery] string? lotNumber = null,
        [FromQuery] string? status = null)
    {
        var query = _context.QualityInspections
            .Include(i => i.ProductionOrder)
            .Include(i => i.ProductionOrderOperation)
            .Include(i => i.Item)
            .Include(i => i.NonConformanceReport)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(lotNumber))
        {
            query = query.Where(i => i.LotNumber.Contains(lotNumber.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(i => i.Status == status.Trim());
        }

        var inspections = await query
            .OrderByDescending(i => i.InspectionDate)
            .ToListAsync();

        return Ok(inspections.Select(MapToInspectionDto));
    }

    /// <summary>
    /// Obtiene el detalle de una inspección de calidad por su ID, incluyendo el NCR si fue rechazada.
    /// </summary>
    [HttpGet("inspections/{id:int}")]
    public async Task<ActionResult<QualityInspectionResponseDto>> GetInspectionById(int id)
    {
        var inspection = await _context.QualityInspections
            .Include(i => i.ProductionOrder)
            .Include(i => i.ProductionOrderOperation)
            .Include(i => i.Item)
            .Include(i => i.NonConformanceReport)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inspection == null)
        {
            return NotFound(new { message = $"No se encontró la inspección con ID {id}." });
        }

        return Ok(MapToInspectionDto(inspection));
    }

    /// <summary>
    /// Registra una nueva inspección de calidad técnica (RO-5):
    /// 1. Valida humedad (rango 15% - 25%).
    /// 2. Valida peso por bolsa (objetivo 5.0 kg ± 0.15 kg).
    /// 3. Si cumple los parámetros -> Estado 'Aprobado'.
    /// 4. Si incumple algún parámetro -> Estado 'Rechazado' y genera automáticamente un Reporte de No Conformidad (NCR).
    /// </summary>
    [HttpPost("inspections")]
    public async Task<ActionResult<QualityInspectionResponseDto>> CreateInspection([FromBody] CreateQualityInspectionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.LotNumber))
        {
            return BadRequest(new { message = "El número de lote a inspeccionar es obligatorio." });
        }

        string cleanLot = dto.LotNumber.Trim();

        // 1. Vincular orden de producción o artículo si no vienen especificados
        ProductionOrder? prodOrder = null;
        if (dto.ProductionOrderId.HasValue && dto.ProductionOrderId.Value > 0)
        {
            prodOrder = await _context.ProductionOrders
                .Include(p => p.Item)
                .FirstOrDefaultAsync(p => p.Id == dto.ProductionOrderId.Value);
        }
        else
        {
            prodOrder = await _context.ProductionOrders
                .Include(p => p.Item)
                .FirstOrDefaultAsync(p => p.LotNumber == cleanLot);
        }

        Item? item = null;
        if (dto.ItemId.HasValue && dto.ItemId.Value > 0)
        {
            item = await _context.Items.FindAsync(dto.ItemId.Value);
        }
        else
        {
            item = prodOrder?.Item ?? await _context.Items.FirstOrDefaultAsync(i => i.Code == "PT-001");
        }

        // Vincular operación RO-5 si no viene indicada
        ProductionOrderOperation? ro5Op = null;
        if (dto.ProductionOrderOperationId.HasValue && dto.ProductionOrderOperationId.Value > 0)
        {
            ro5Op = await _context.ProductionOrderOperations.FindAsync(dto.ProductionOrderOperationId.Value);
        }
        else if (prodOrder != null)
        {
            ro5Op = await _context.ProductionOrderOperations
                .FirstOrDefaultAsync(o => o.ProductionOrderId == prodOrder.Id && (o.OperationCode == "RO-5" || o.IsQualityCheck));
        }

        // 2. VALIDACIÓN TÉCNICA DE PARÁMETROS DE CALIDAD (HUMEDAD Y PESO)
        var deviations = new List<string>();
        string? humidityDeviation = null;
        string? weightDeviation = null;

        // Validación de Humedad (15% - 25%)
        if (dto.HumidityPercentage < MinAcceptableHumidity)
        {
            humidityDeviation = $"Humedad baja detectada: {dto.HumidityPercentage:F2}% (mínimo permitido {MinAcceptableHumidity:F2}%). Muestra excesivamente reseca.";
            deviations.Add(humidityDeviation);
        }
        else if (dto.HumidityPercentage > MaxAcceptableHumidity)
        {
            humidityDeviation = $"Humedad alta detectada: {dto.HumidityPercentage:F2}% (máximo permitido {MaxAcceptableHumidity:F2}%). Riesgo de fermentación o proliferación fúngica.";
            deviations.Add(humidityDeviation);
        }

        // Validación de Peso (5.00 kg ± tolerancia)
        if (dto.WeightKg < MinAcceptableWeightKg)
        {
            weightDeviation = $"Peso insuficiente: {dto.WeightKg:F2} kg (objetivo {TargetWeightKg:F2} kg, mínimo tolerable {MinAcceptableWeightKg:F2} kg).";
            deviations.Add(weightDeviation);
        }
        else if (dto.WeightKg > MaxAcceptableWeightKg)
        {
            weightDeviation = $"Sobrepeso detectado: {dto.WeightKg:F2} kg (objetivo {TargetWeightKg:F2} kg, máximo tolerable {MaxAcceptableWeightKg:F2} kg).";
            deviations.Add(weightDeviation);
        }

        bool isApproved = deviations.Count == 0;
        string status = isApproved ? "Aprobado" : "Rechazado";
        string? nonConformanceReason = isApproved ? null : string.Join(" | ", deviations);

        // 3. Generar Código de Inspección
        var count = await _context.QualityInspections.CountAsync();
        string inspectionCode = $"INS-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";

        var inspection = new QualityInspection
        {
            InspectionCode = inspectionCode,
            LotNumber = cleanLot,
            ProductionOrderId = prodOrder?.Id,
            ProductionOrderOperationId = ro5Op?.Id,
            ItemId = item?.Id,
            InspectionDate = DateTime.UtcNow,
            InspectorName = !string.IsNullOrWhiteSpace(dto.InspectorName) ? dto.InspectorName.Trim() : (User.Identity?.Name ?? "Control de Calidad"),
            HumidityPercentage = dto.HumidityPercentage,
            WeightKg = dto.WeightKg,
            Appearance = dto.Appearance ?? "Textura granulada fina, color café oscuro homogéneo sin grumos.",
            Ph = dto.Ph ?? 6.5m,
            Status = status,
            HasNonConformance = !isApproved,
            NonConformanceReason = nonConformanceReason,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.QualityInspections.Add(inspection);
        await _context.SaveChangesAsync();

        // 4. SI HUBO DESVIACIÓN, DISPARAR AUTOMÁTICAMENTE EL REPORTE DE NO CONFORMIDAD (NCR)
        NonConformanceReport? ncr = null;
        if (!isApproved)
        {
            var ncrCount = await _context.NonConformanceReports.CountAsync();
            string ncrNumber = $"NCR-{DateTime.UtcNow:yyyyMMdd}-{(ncrCount + 1):D4}";

            // Definir severidad
            string severity = "Mayor";
            if (dto.HumidityPercentage > 30.0m || dto.WeightKg < 4.0m)
            {
                severity = "Crítica";
            }
            else if (dto.HumidityPercentage > MaxAcceptableHumidity && dto.HumidityPercentage <= 27.0m)
            {
                severity = "Mayor";
            }

            // Acción propuesta por defecto según el tipo de defecto
            string proposedAction = !string.IsNullOrWhiteSpace(dto.ProposedActionIfRejected)
                ? dto.ProposedActionIfRejected
                : (dto.HumidityPercentage > MaxAcceptableHumidity
                    ? "Retrabajo: reingreso a patio de secado solar (RO-3) por 12 horas adicionales."
                    : "Reenvasado y ajuste de gramaje en báscula de empaque (RO-6).");

            ncr = new NonConformanceReport
            {
                NcrNumber = ncrNumber,
                QualityInspectionId = inspection.Id,
                LotNumber = cleanLot,
                ProductionOrderId = prodOrder?.Id,
                ReportDate = DateTime.UtcNow,
                Severity = severity,
                DefectDescription = nonConformanceReason!,
                HumidityDeviation = humidityDeviation,
                WeightDeviation = weightDeviation,
                RootCause = dto.HumidityPercentage > MaxAcceptableHumidity
                    ? "Tiempo insuficiente de exposición en secado solar o alta humedad relativa ambiental."
                    : "Descalibración en tolva dosificadora de envasado.",
                ProposedAction = proposedAction,
                Status = "Abierto",
                ResponsiblePerson = inspection.InspectorName,
                CreatedAt = DateTime.UtcNow
            };

            _context.NonConformanceReports.Add(ncr);

            // Actualizar lote a estado 'En Cuarentena' si existe en InventoryLots
            var invLot = await _context.InventoryLots.FirstOrDefaultAsync(l => l.LotNumber == cleanLot);
            if (invLot != null)
            {
                invLot.Status = "En Cuarentena";
            }

            _logger.LogWarning("No Conformidad detectada en Lote {LotNumber}. Reporte generado: {NcrNumber} con severidad {Severity}.",
                cleanLot, ncrNumber, severity);
        }
        else
        {
            // Lote aprobado conforme
            var invLot = await _context.InventoryLots.FirstOrDefaultAsync(l => l.LotNumber == cleanLot);
            if (invLot != null && invLot.Status == "En Cuarentena")
            {
                invLot.Status = "Disponible";
            }

            _logger.LogInformation("Inspección {InspectionCode} APROBADA para Lote {LotNumber}. Humedad: {Humidity}%, Peso: {Weight}kg.",
                inspectionCode, cleanLot, dto.HumidityPercentage, dto.WeightKg);
        }

        // 5. Si la operación RO-5 estaba pendiente o iniciada, registrar avance
        if (ro5Op != null)
        {
            ro5Op.Status = "Completado";
            ro5Op.CompletedAt = DateTime.UtcNow;
            ro5Op.ExecutedBy = inspection.InspectorName;
            ro5Op.OperatorNotes = $"Inspección RO-5 realizada ({status}). Humedad: {dto.HumidityPercentage:F1}%, Peso: {dto.WeightKg:F2}kg.";
        }

        await _context.SaveChangesAsync();

        var created = await _context.QualityInspections
            .Include(i => i.ProductionOrder)
            .Include(i => i.ProductionOrderOperation)
            .Include(i => i.Item)
            .Include(i => i.NonConformanceReport)
            .FirstAsync(i => i.Id == inspection.Id);

        return CreatedAtAction(nameof(GetInspectionById), new { id = inspection.Id }, MapToInspectionDto(created));
    }

    /// <summary>
    /// Consulta el listado de Reportes de No Conformidad (NCR).
    /// </summary>
    [HttpGet("ncrs")]
    public async Task<ActionResult<IEnumerable<NonConformanceReportResponseDto>>> GetNcrs(
        [FromQuery] string? status = null,
        [FromQuery] string? severity = null)
    {
        var query = _context.NonConformanceReports
            .Include(n => n.QualityInspection)
            .Include(n => n.ProductionOrder)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(n => n.Status == status.Trim());
        }

        if (!string.IsNullOrWhiteSpace(severity) && severity != "ALL")
        {
            query = query.Where(n => n.Severity == severity.Trim());
        }

        var list = await query
            .OrderByDescending(n => n.ReportDate)
            .ToListAsync();

        return Ok(list.Select(MapToNcrDto));
    }

    /// <summary>
    /// Obtiene el detalle de un Reporte de No Conformidad (NCR) por su ID.
    /// </summary>
    [HttpGet("ncrs/{id:int}")]
    public async Task<ActionResult<NonConformanceReportResponseDto>> GetNcrById(int id)
    {
        var ncr = await _context.NonConformanceReports
            .Include(n => n.QualityInspection)
            .Include(n => n.ProductionOrder)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (ncr == null)
        {
            return NotFound(new { message = $"No se encontró el reporte de no conformidad con ID {id}." });
        }

        return Ok(MapToNcrDto(ncr));
    }

    /// <summary>
    /// Cierra un Reporte de No Conformidad documentando la resolución técnica implementada (ej. Retrabajo completado).
    /// </summary>
    [HttpPost("ncrs/{id:int}/close")]
    public async Task<ActionResult<NonConformanceReportResponseDto>> CloseNcr(
        int id,
        [FromBody] CloseNcrRequestDto dto)
    {
        var ncr = await _context.NonConformanceReports
            .Include(n => n.QualityInspection)
            .Include(n => n.ProductionOrder)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (ncr == null)
        {
            return NotFound(new { message = $"No se encontró el reporte de no conformidad con ID {id}." });
        }

        if (ncr.Status == "Cerrado")
        {
            return BadRequest(new { message = $"El reporte '{ncr.NcrNumber}' ya fue cerrado anteriormente." });
        }

        ncr.Status = "Cerrado";
        ncr.ClosedAt = DateTime.UtcNow;
        ncr.ResolutionNotes = dto.ResolutionNotes;
        if (!string.IsNullOrWhiteSpace(dto.ResponsiblePerson))
        {
            ncr.ResponsiblePerson = dto.ResponsiblePerson;
        }

        // Si se resolvió, devolver lote a disponible si no está marcado como scrap
        if (dto.ActionTaken != "Scrap")
        {
            var invLot = await _context.InventoryLots.FirstOrDefaultAsync(l => l.LotNumber == ncr.LotNumber);
            if (invLot != null)
            {
                invLot.Status = "Disponible";
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Reporte de No Conformidad {NcrNumber} cerrado exitosamente. Resolución: {Resolution}",
            ncr.NcrNumber, dto.ResolutionNotes);

        return Ok(MapToNcrDto(ncr));
    }

    private static QualityInspectionResponseDto MapToInspectionDto(QualityInspection i)
    {
        return new QualityInspectionResponseDto
        {
            Id = i.Id,
            InspectionCode = i.InspectionCode,
            LotNumber = i.LotNumber,
            ProductionOrderId = i.ProductionOrderId,
            ProductionOrderNumber = i.ProductionOrder?.OrderNumber,
            ProductionOrderOperationId = i.ProductionOrderOperationId,
            OperationCode = i.ProductionOrderOperation?.OperationCode ?? "RO-5",
            ItemId = i.ItemId,
            ItemCode = i.Item?.Code,
            ItemName = i.Item?.Name,
            InspectionDate = i.InspectionDate,
            InspectorName = i.InspectorName,
            HumidityPercentage = i.HumidityPercentage,
            WeightKg = i.WeightKg,
            Appearance = i.Appearance,
            Ph = i.Ph,
            Status = i.Status,
            HasNonConformance = i.HasNonConformance,
            NonConformanceReason = i.NonConformanceReason,
            Notes = i.Notes,
            NcrId = i.NonConformanceReport?.Id,
            NcrNumber = i.NonConformanceReport?.NcrNumber,
            CreatedAt = i.CreatedAt
        };
    }

    private static NonConformanceReportResponseDto MapToNcrDto(NonConformanceReport n)
    {
        return new NonConformanceReportResponseDto
        {
            Id = n.Id,
            NcrNumber = n.NcrNumber,
            QualityInspectionId = n.QualityInspectionId,
            InspectionCode = n.QualityInspection?.InspectionCode ?? string.Empty,
            LotNumber = n.LotNumber,
            ProductionOrderId = n.ProductionOrderId,
            ProductionOrderNumber = n.ProductionOrder?.OrderNumber,
            ReportDate = n.ReportDate,
            Severity = n.Severity,
            DefectDescription = n.DefectDescription,
            HumidityDeviation = n.HumidityDeviation,
            WeightDeviation = n.WeightDeviation,
            RootCause = n.RootCause,
            ProposedAction = n.ProposedAction,
            Status = n.Status,
            ResponsiblePerson = n.ResponsiblePerson,
            ResolutionNotes = n.ResolutionNotes,
            ClosedAt = n.ClosedAt,
            CreatedAt = n.CreatedAt
        };
    }
}
