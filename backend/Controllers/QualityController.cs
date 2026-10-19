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
            if (invLot != null && (invLot.Status == "En Cuarentena" || invLot.Status == "Rechazado"))
            {
                invLot.Status = "Disponible";
            }

            // Si existía un NCR abierto o en tratamiento para este lote u orden, cerrarlo automáticamente tras reinspección aprobada
            var activeNcrForLot = await _context.NonConformanceReports
                .FirstOrDefaultAsync(n => (n.LotNumber == cleanLot || (prodOrder != null && n.ProductionOrderId == prodOrder.Id)) && n.Status != "Cerrado");

            if (activeNcrForLot != null)
            {
                activeNcrForLot.Status = "Cerrado";
                activeNcrForLot.ClosedAt = DateTime.UtcNow;
                activeNcrForLot.ResolutionNotes = string.IsNullOrWhiteSpace(activeNcrForLot.ResolutionNotes)
                    ? $"Reinspección aprobada mediante {inspectionCode}. Humedad: {dto.HumidityPercentage:F2}%, Peso: {dto.WeightKg:F2}kg. Desviaciones superadas satisfactoriamente."
                    : $"{activeNcrForLot.ResolutionNotes} | Reinspección aprobada mediante {inspectionCode}. Humedad: {dto.HumidityPercentage:F2}%, Peso: {dto.WeightKg:F2}kg.";
                _logger.LogInformation("NCR {NcrNumber} cerrado automáticamente tras reinspección aprobada {InspectionCode}.",
                    activeNcrForLot.NcrNumber, inspectionCode);
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

    /// <summary>
    /// Ejecuta la disposición por Scrap (Merma) para un Reporte de No Conformidad:
    /// 1. Dictamina desecho total o parcial del lote afectado.
    /// 2. Da salida de inventario desde ALM-002 (WIP) hacia pérdida / desecho.
    /// 3. Documenta el movimiento tipo SCRAP_MERMA en el Kardex inmutable (InventoryTransaction).
    /// 4. Actualiza ScrapQuantity en la Orden de Producción y marca el lote como 'Scrap / Desecho'.
    /// 5. Cierra el NCR con dictamen de Scrap.
    /// </summary>
    [HttpPost("ncrs/{id:int}/dispose-scrap")]
    public async Task<ActionResult<NcrDispositionResultDto>> DisposeScrap(
        int id,
        [FromBody] DisposeScrapRequestDto? dto = null)
    {
        var ncr = await _context.NonConformanceReports
            .Include(n => n.QualityInspection)
            .Include(n => n.ProductionOrder)
                .ThenInclude(p => p!.Materials)
            .Include(n => n.ProductionOrder)
                .ThenInclude(p => p!.Operations)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (ncr == null)
        {
            return NotFound(new { message = $"No se encontró el reporte de no conformidad con ID {id}." });
        }

        if (ncr.Status == "Cerrado")
        {
            return BadRequest(new { message = $"El reporte '{ncr.NcrNumber}' ya fue cerrado anteriormente." });
        }

        var almWip = await _context.Warehouses.FirstOrDefaultAsync(w => w.Code == "ALM-002");
        if (almWip == null)
        {
            return BadRequest(new { message = "El almacén ALM-002 (WIP) no está configurado en la base de datos." });
        }

        var order = ncr.ProductionOrder;
        if (order == null && !string.IsNullOrEmpty(ncr.LotNumber))
        {
            order = await _context.ProductionOrders
                .Include(p => p.Materials)
                .Include(p => p.Operations)
                .FirstOrDefaultAsync(p => p.LotNumber == ncr.LotNumber);
        }

        decimal scrapQuantity = dto?.ScrapQuantity ?? (order?.PlannedQuantity > 0 ? order.PlannedQuantity : 1.0m);
        decimal totalScrappedCost = 0m;
        DateTime executionTime = DateTime.UtcNow;

        // Si hay una orden de producción vinculada, descontar los materiales en proceso (WIP) en ALM-002
        if (order != null)
        {
            order.ScrapQuantity += scrapQuantity;
            order.Status = "Cancelada"; // Cancelada por merma total
            order.ActualEndDate = executionTime;
            order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                ? $"Cancelada por merma/scrap según {ncr.NcrNumber}: {dto?.Reason ?? ncr.DefectDescription}"
                : $"{order.Notes} | Merma {ncr.NcrNumber}: {dto?.Reason ?? ncr.DefectDescription}";

            foreach (var material in order.Materials)
            {
                decimal qtyToDeduct = material.ConsumedQuantity > 0 ? material.ConsumedQuantity : material.RequiredQuantity;
                string matLot = material.LotNumber ?? string.Empty;

                var wipStock = await _context.InventoryStocks
                    .FirstOrDefaultAsync(s => s.WarehouseId == almWip.Id && s.ItemId == material.ItemId && s.LotNumber == matLot);

                if (wipStock != null)
                {
                    decimal deduct = Math.Min(wipStock.Quantity, qtyToDeduct);
                    wipStock.Quantity -= deduct;
                    wipStock.LastUpdated = executionTime;
                }

                decimal matCost = material.TotalCost > 0 ? material.TotalCost : (material.UnitCost * qtyToDeduct);
                totalScrappedCost += matCost;

                var scrapTx = new InventoryTransaction
                {
                    TransactionDate = executionTime,
                    TransactionType = "SCRAP_MERMA",
                    ItemId = material.ItemId,
                    SourceWarehouseId = almWip.Id,
                    DestinationWarehouseId = null, // Pérdida / Merma definitiva hacia desecho
                    LotNumber = matLot,
                    Quantity = qtyToDeduct,
                    UnitCost = material.UnitCost,
                    TotalCost = matCost,
                    ReferenceNumber = $"{order.OrderNumber} / {ncr.NcrNumber}",
                    Notes = $"Salida por Scrap/Merma dictaminada por {ncr.NcrNumber}. Motivo: {dto?.Reason ?? ncr.DefectDescription}.",
                    PerformedBy = dto?.ResponsiblePerson ?? ncr.ResponsiblePerson ?? "Control de Calidad",
                    CreatedAt = executionTime
                };
                _context.InventoryTransactions.Add(scrapTx);
            }
        }

        // Marcar el lote como 'Scrap / Desecho' en InventoryLots
        var invLots = await _context.InventoryLots
            .Where(l => l.LotNumber == ncr.LotNumber || (order != null && order.LotNumber != null && l.LotNumber == order.LotNumber))
            .ToListAsync();

        foreach (var lot in invLots)
        {
            lot.Status = "Scrap / Desecho";
            lot.CurrentQuantity = 0;
            lot.Notes = string.IsNullOrWhiteSpace(lot.Notes)
                ? $"Desecho por {ncr.NcrNumber}"
                : $"{lot.Notes} | Disposición final: Scrap por {ncr.NcrNumber}";
        }

        // Actualizar y cerrar el NCR
        ncr.Status = "Cerrado";
        ncr.ProposedAction = "Scrap";
        ncr.ClosedAt = executionTime;
        ncr.ResolutionNotes = $"Disposición de Scrap ejecutada. Salida definitiva de ALM-002 hacia merma documentada en Kardex. Motivo: {dto?.Reason ?? ncr.DefectDescription}. {dto?.Notes}".Trim();
        if (!string.IsNullOrWhiteSpace(dto?.ResponsiblePerson))
        {
            ncr.ResponsiblePerson = dto.ResponsiblePerson;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Disposición de Scrap ejecutada exitosamente para NCR {NcrNumber}. Lote {LotNumber} marcado como Scrap/Desecho. Merma total: {Cost:C}",
            ncr.NcrNumber, ncr.LotNumber, totalScrappedCost);

        return Ok(new NcrDispositionResultDto
        {
            NcrId = ncr.Id,
            NcrNumber = ncr.NcrNumber,
            DispositionType = "Scrap",
            NcrStatus = ncr.Status,
            LotNumber = ncr.LotNumber,
            LotStatus = "Scrap / Desecho",
            ProductionOrderId = order?.Id,
            ProductionOrderNumber = order?.OrderNumber,
            ProductionOrderStatus = order?.Status,
            ScrappedQuantity = scrapQuantity,
            TotalCostScrapped = totalScrappedCost,
            ReactivatedOperations = new List<string>(),
            Message = $"Disposición por Scrap (Merma) ejecutada exitosamente. Se dio salida del material en WIP (ALM-002) y se registró la transacción SCRAP_MERMA en el Kardex. El lote '{ncr.LotNumber}' queda marcado como Scrap/Desecho.",
            DispositionDate = executionTime
        });
    }

    /// <summary>
    /// Ejecuta la disposición por Retrabajo para un Reporte de No Conformidad:
    /// 1. Dictamina retrabajo técnico para corregir desviaciones (humedad, peso, etc.).
    /// 2. Reactiva la Orden de Producción regresándola a estado 'En Proceso'.
    /// 3. Reactiva operaciones específicas de la ruta (ej. RO-3 secado solar, RO-4 mezclado o RO-6 envasado)
    ///    para acumular nuevos tiempos reales en MES y permitir nueva inspección en RO-5.
    /// 4. Mantiene el lote en cuarentena y bloqueado hacia ALM-003.
    /// 5. Actualiza el NCR a estado 'En Tratamiento'.
    /// </summary>
    [HttpPost("ncrs/{id:int}/dispose-rework")]
    public async Task<ActionResult<NcrDispositionResultDto>> DisposeRework(
        int id,
        [FromBody] DisposeReworkRequestDto? dto = null)
    {
        var ncr = await _context.NonConformanceReports
            .Include(n => n.QualityInspection)
            .Include(n => n.ProductionOrder)
                .ThenInclude(p => p!.Operations)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (ncr == null)
        {
            return NotFound(new { message = $"No se encontró el reporte de no conformidad con ID {id}." });
        }

        if (ncr.Status == "Cerrado")
        {
            return BadRequest(new { message = $"El reporte '{ncr.NcrNumber}' ya fue cerrado anteriormente." });
        }

        var order = ncr.ProductionOrder;
        if (order == null && !string.IsNullOrEmpty(ncr.LotNumber))
        {
            order = await _context.ProductionOrders
                .Include(p => p.Operations)
                .FirstOrDefaultAsync(p => p.LotNumber == ncr.LotNumber);
        }

        DateTime executionTime = DateTime.UtcNow;

        // 1. Reactivar la Orden de Producción
        if (order != null)
        {
            order.Status = "En Proceso";
            order.ActualEndDate = null;
            order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                ? $"Reabierta para retrabajo según {ncr.NcrNumber}: {dto?.Instructions ?? ncr.ProposedAction}"
                : $"{order.Notes} | Retrabajo {ncr.NcrNumber}: {dto?.Instructions ?? ncr.ProposedAction}";
        }

        // 2. Determinar las operaciones de ruta a reactivar
        var targetOpCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (dto?.ReworkOperations != null && dto.ReworkOperations.Count > 0)
        {
            foreach (var op in dto.ReworkOperations)
            {
                if (!string.IsNullOrWhiteSpace(op)) targetOpCodes.Add(op.Trim().ToUpperInvariant());
            }
        }
        else
        {
            // Determinar automáticamente según el tipo de desviación técnica detectada
            if (!string.IsNullOrWhiteSpace(ncr.HumidityDeviation))
            {
                // Desviación en humedad requiere reactivar Secado Solar (RO-3), Homogeneizado (RO-4) e Inspección (RO-5)
                targetOpCodes.Add("RO-3");
                targetOpCodes.Add("RO-4");
                targetOpCodes.Add("RO-5");
            }
            else if (!string.IsNullOrWhiteSpace(ncr.WeightDeviation))
            {
                // Desviación en peso requiere reactivar Envasado (RO-6), Sellado (RO-7) e Inspección (RO-5)
                targetOpCodes.Add("RO-6");
                targetOpCodes.Add("RO-7");
                targetOpCodes.Add("RO-5");
            }
            else
            {
                targetOpCodes.Add("RO-3");
                targetOpCodes.Add("RO-5");
            }
        }

        var reactivatedNames = new List<string>();

        if (order != null)
        {
            foreach (var op in order.Operations)
            {
                if (targetOpCodes.Contains(op.OperationCode))
                {
                    op.Status = "Iniciado"; // Operación reactivada para retrabajo
                    op.StartedAt = executionTime;
                    op.CompletedAt = null; // Reiniciar completion para permitir nuevo registro de tiempos reales en MES
                    op.OperatorNotes = string.IsNullOrWhiteSpace(op.OperatorNotes)
                        ? $"Retrabajo iniciado según {ncr.NcrNumber}: {dto?.Instructions ?? "Ajuste técnico solicitado"}"
                        : $"{op.OperatorNotes} | Retrabajo {ncr.NcrNumber}: {dto?.Instructions ?? "Ajuste técnico"}";
                    reactivatedNames.Add($"{op.OperationCode} - {op.Name}");
                }
            }
        }

        // 3. Mantener el Lote estrictamente en Cuarentena
        var invLots = await _context.InventoryLots
            .Where(l => l.LotNumber == ncr.LotNumber || (order != null && order.LotNumber != null && l.LotNumber == order.LotNumber))
            .ToListAsync();

        foreach (var lot in invLots)
        {
            lot.Status = "En Cuarentena";
            lot.Notes = string.IsNullOrWhiteSpace(lot.Notes)
                ? $"En Cuarentena por Retrabajo según {ncr.NcrNumber}"
                : $"{lot.Notes} | Retrabajo activo por {ncr.NcrNumber}";
        }

        // 4. Actualizar estado del NCR a 'En Tratamiento'
        ncr.Status = "En Tratamiento";
        ncr.ProposedAction = "Retrabajo";
        ncr.ResolutionNotes = $"Retrabajo ordenado en operaciones [{string.Join(", ", targetOpCodes)}]. Instrucciones: {dto?.Instructions ?? ncr.ProposedAction}. Lote en cuarentena hasta nueva reinspección aprobada.";
        if (!string.IsNullOrWhiteSpace(dto?.ResponsiblePerson))
        {
            ncr.ResponsiblePerson = dto.ResponsiblePerson;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Disposición por Retrabajo autorizada para NCR {NcrNumber}. Operaciones reactivadas: {Ops}. Lote {LotNumber} en cuarentena.",
            ncr.NcrNumber, string.Join(", ", targetOpCodes), ncr.LotNumber);

        return Ok(new NcrDispositionResultDto
        {
            NcrId = ncr.Id,
            NcrNumber = ncr.NcrNumber,
            DispositionType = "Retrabajo",
            NcrStatus = ncr.Status,
            LotNumber = ncr.LotNumber,
            LotStatus = "En Cuarentena",
            ProductionOrderId = order?.Id,
            ProductionOrderNumber = order?.OrderNumber,
            ProductionOrderStatus = order?.Status,
            ScrappedQuantity = 0m,
            TotalCostScrapped = 0m,
            ReactivatedOperations = reactivatedNames.Count > 0 ? reactivatedNames : targetOpCodes.ToList(),
            Message = $"Disposición por Retrabajo dictaminada exitosamente. La orden de producción fue reactivada a 'En Proceso' y las operaciones de ruta [{string.Join(", ", targetOpCodes)}] fueron reactivadas para acumular nuevos tiempos en MES. El lote permanece estrictamente en cuarentena.",
            DispositionDate = executionTime
        });
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
