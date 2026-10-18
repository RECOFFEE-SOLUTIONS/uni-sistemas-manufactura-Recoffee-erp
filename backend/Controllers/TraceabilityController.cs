using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TraceabilityController : ControllerBase
{
    private readonly ITraceabilityService _traceabilityService;
    private readonly ILogger<TraceabilityController> _logger;

    public TraceabilityController(ITraceabilityService traceabilityService, ILogger<TraceabilityController> logger)
    {
        _traceabilityService = traceabilityService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene la genealogía completa (Upstream hacia materias primas/proveedores y Downstream hacia órdenes de venta/clientes)
    /// a partir de un identificador de lote.
    /// </summary>
    /// <param name="lotNumber">Número oficial de lote (ej: LOTE-PT-001-YYYYMMDD-001 o LOTE-MP-001-001)</param>
    [HttpGet("lot/{lotNumber}")]
    public async Task<ActionResult<LotTraceabilityResponseDto>> GetLotTraceability(string lotNumber)
    {
        if (string.IsNullOrWhiteSpace(lotNumber))
        {
            return BadRequest(new { message = "El número de lote es obligatorio." });
        }

        var result = await _traceabilityService.GetLotTraceabilityAsync(lotNumber);
        if (result == null)
        {
            return NotFound(new { message = $"No se encontró ningún lote con el identificador '{lotNumber}' en el sistema." });
        }

        return Ok(result);
    }

    /// <summary>
    /// Lista todos los lotes trazables en el inventario, con opción de filtro por categoría (PT, MP, EMP, SEM).
    /// </summary>
    [HttpGet("lots")]
    public async Task<ActionResult<IEnumerable<TraceableLotSummaryDto>>> GetTraceableLots([FromQuery] string? category = null)
    {
        var lots = await _traceabilityService.GetTraceableLotsAsync(category);
        return Ok(lots);
    }
}
