using System.Text.Json;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IiotController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<IiotController> _logger;

    public const decimal TargetMoisturePercent = 20.00m; // Meta de secado: <= 20.0%

    public IiotController(ReCoffeeDbContext context, ILogger<IiotController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Webhook receptor de telemetría IIoT para la operación de secado solar (RO-3).
    /// Acepta tanto un payload individual como una lista/array masivo de mediciones.
    /// Asocia automáticamente la telemetría al lote activo en proceso de secado.
    /// </summary>
    [HttpPost("telemetry")]
    [HttpPost("/api/telemetry")]
    public async Task<ActionResult> ReceiveTelemetry([FromBody] JsonElement rawBody)
    {
        var payloads = new List<IiotTelemetryPayloadDto>();

        try
        {
            if (rawBody.ValueKind == JsonValueKind.Array)
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var deserialized = JsonSerializer.Deserialize<List<IiotTelemetryPayloadDto>>(rawBody.GetRawText(), options);
                if (deserialized != null) payloads.AddRange(deserialized);
            }
            else if (rawBody.ValueKind == JsonValueKind.Object)
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var single = JsonSerializer.Deserialize<IiotTelemetryPayloadDto>(rawBody.GetRawText(), options);
                if (single != null) payloads.Add(single);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al deserializar payload de telemetría IIoT");
            return BadRequest(new { message = "Formato JSON de telemetría inválido.", details = ex.Message });
        }

        if (payloads.Count == 0)
        {
            return BadRequest(new { message = "No se recibieron datos de telemetría en la solicitud." });
        }

        // Buscar lote y orden de producción activos en operación RO-3 si no vienen provistos
        var activeRo3Op = await _context.ProductionOrderOperations
            .Include(o => o.ProductionOrder)
            .Where(o => o.OperationCode == "RO-3" && (o.Status == "Iniciado" || o.ProductionOrder!.Status == "En Proceso"))
            .OrderByDescending(o => o.StartedAt ?? o.ProductionOrder!.ActualStartDate)
            .FirstOrDefaultAsync();

        ProductionOrder? fallbackOrder = null;
        if (activeRo3Op?.ProductionOrder == null)
        {
            fallbackOrder = await _context.ProductionOrders
                .Where(o => o.Status == "En Proceso")
                .OrderByDescending(o => o.ActualStartDate)
                .FirstOrDefaultAsync();
        }

        var defaultOrder = activeRo3Op?.ProductionOrder ?? fallbackOrder;
        string defaultLot = defaultOrder?.LotNumber
            ?? $"LOTE-PT-001-{DateTime.UtcNow:yyyyMMdd}-001";
        int? defaultOrderId = defaultOrder?.Id;

        var savedLogs = new List<IiotTelemetryLog>();
        DateTime now = DateTime.UtcNow;

        foreach (var p in payloads)
        {
            decimal temp = p.TemperatureCelsius != 0 ? p.TemperatureCelsius : (p.Temperature ?? 25.0m);
            decimal moisture = p.MoisturePercent != 0 ? p.MoisturePercent : (p.Moisture ?? 65.0m);
            string opCode = !string.IsNullOrWhiteSpace(p.OperationCode)
                ? p.OperationCode.Trim().ToUpperInvariant()
                : (!string.IsNullOrWhiteSpace(p.WorkCenter) ? p.WorkCenter.Trim().ToUpperInvariant() : "RO-3");
            string sensor = !string.IsNullOrWhiteSpace(p.SensorId) ? p.SensorId.Trim() : "SENSOR-RO3-SOLAR-01";
            string lot = !string.IsNullOrWhiteSpace(p.LotNumber) ? p.LotNumber.Trim() : defaultLot;
            int? orderId = p.ProductionOrderId.HasValue && p.ProductionOrderId.Value > 0
                ? p.ProductionOrderId.Value
                : defaultOrderId;

            var log = new IiotTelemetryLog
            {
                ProductionOrderId = orderId,
                LotNumber = lot,
                OperationCode = opCode,
                SensorId = sensor,
                TemperatureCelsius = Math.Round(temp, 2),
                MoisturePercent = Math.Round(moisture, 2),
                Timestamp = p.Timestamp ?? now,
                CreatedAt = now
            };

            savedLogs.Add(log);
            _context.IiotTelemetryLogs.Add(log);

            // Si la humedad alcanzó o bajó del 20%, actualizar notas en RO-3 si está activa
            if (moisture <= TargetMoisturePercent && activeRo3Op != null && activeRo3Op.Status == "Iniciado")
            {
                activeRo3Op.OperatorNotes = string.IsNullOrWhiteSpace(activeRo3Op.OperatorNotes)
                    ? $"Humedad objetivo alcanzada ({moisture:F1}%) registrada por {sensor}."
                    : $"{activeRo3Op.OperatorNotes} | Meta alcanzada: {moisture:F1}%.";
            }
        }

        await _context.SaveChangesAsync();

        var latest = savedLogs.Last();
        bool isTargetAchieved = latest.MoisturePercent <= TargetMoisturePercent;

        _logger.LogInformation("Telemetría IIoT recibida ({Count} registros). Lote: {Lot}, Humedad: {Moist}%, Temp: {Temp}°C, Meta Alcanzada: {Achieved}",
            savedLogs.Count, latest.LotNumber, latest.MoisturePercent, latest.TemperatureCelsius, isTargetAchieved);

        if (payloads.Count == 1)
        {
            return Ok(new IiotTelemetryResponseDto
            {
                Id = latest.Id,
                ProductionOrderId = latest.ProductionOrderId,
                OrderNumber = defaultOrder?.OrderNumber,
                LotNumber = latest.LotNumber,
                OperationCode = latest.OperationCode,
                SensorId = latest.SensorId,
                TemperatureCelsius = latest.TemperatureCelsius,
                MoisturePercent = latest.MoisturePercent,
                Timestamp = latest.Timestamp,
                IsTargetMoistureAchieved = isTargetAchieved,
                CreatedAt = latest.CreatedAt
            });
        }

        return Ok(new IiotBatchTelemetryResponseDto
        {
            ReceivedCount = savedLogs.Count,
            LotNumber = latest.LotNumber,
            LatestMoisture = latest.MoisturePercent,
            LatestTemperature = latest.TemperatureCelsius,
            IsTargetMoistureAchieved = isTargetAchieved,
            Message = $"Se registraron {savedLogs.Count} mediciones de telemetría para el lote '{latest.LotNumber}'."
        });
    }

    /// <summary>
    /// Consulta el historial reciente de telemetría para gráficas en tiempo real.
    /// </summary>
    [HttpGet("telemetry/history")]
    public async Task<ActionResult<IEnumerable<IiotTelemetryResponseDto>>> GetTelemetryHistory(
        [FromQuery] string? lotNumber = null,
        [FromQuery] int limit = 60)
    {
        var query = _context.IiotTelemetryLogs
            .Include(l => l.ProductionOrder)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(lotNumber))
        {
            query = query.Where(l => l.LotNumber == lotNumber.Trim());
        }

        var list = await query
            .OrderByDescending(l => l.Timestamp)
            .Take(Math.Clamp(limit, 1, 500))
            .ToListAsync();

        // Ordenar cronológicamente para trazado de series temporales
        list.Reverse();

        return Ok(list.Select(l => new IiotTelemetryResponseDto
        {
            Id = l.Id,
            ProductionOrderId = l.ProductionOrderId,
            OrderNumber = l.ProductionOrder?.OrderNumber,
            LotNumber = l.LotNumber,
            OperationCode = l.OperationCode,
            SensorId = l.SensorId,
            TemperatureCelsius = l.TemperatureCelsius,
            MoisturePercent = l.MoisturePercent,
            Timestamp = l.Timestamp,
            IsTargetMoistureAchieved = l.MoisturePercent <= TargetMoisturePercent,
            CreatedAt = l.CreatedAt
        }));
    }

    /// <summary>
    /// Obtiene la última lectura registrada del sensor para el lote activo.
    /// </summary>
    [HttpGet("telemetry/latest")]
    public async Task<ActionResult<IiotTelemetryResponseDto>> GetLatestTelemetry([FromQuery] string? lotNumber = null)
    {
        var query = _context.IiotTelemetryLogs
            .Include(l => l.ProductionOrder)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(lotNumber))
        {
            query = query.Where(l => l.LotNumber == lotNumber.Trim());
        }

        var latest = await query
            .OrderByDescending(l => l.Timestamp)
            .FirstOrDefaultAsync();

        if (latest == null)
        {
            return NotFound(new { message = "No hay registros de telemetría disponibles." });
        }

        return Ok(new IiotTelemetryResponseDto
        {
            Id = latest.Id,
            ProductionOrderId = latest.ProductionOrderId,
            OrderNumber = latest.ProductionOrder?.OrderNumber,
            LotNumber = latest.LotNumber,
            OperationCode = latest.OperationCode,
            SensorId = latest.SensorId,
            TemperatureCelsius = latest.TemperatureCelsius,
            MoisturePercent = latest.MoisturePercent,
            Timestamp = latest.Timestamp,
            IsTargetMoistureAchieved = latest.MoisturePercent <= TargetMoisturePercent,
            CreatedAt = latest.CreatedAt
        });
    }
}
