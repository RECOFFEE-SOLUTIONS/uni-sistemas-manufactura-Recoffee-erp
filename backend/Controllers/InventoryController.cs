using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<InventoryController> _logger;

    public InventoryController(IInventoryService inventoryService, ILogger<InventoryController> logger)
    {
        _inventoryService = inventoryService;
        _logger = logger;
    }

    /// <summary>
    /// Consulta las existencias actuales de inventario agrupadas por artículo, almacén y lote.
    /// </summary>
    [HttpGet("stock")]
    public async Task<ActionResult<IEnumerable<InventoryStockResponseDto>>> GetStock(
        [FromQuery] int? warehouseId = null,
        [FromQuery] int? itemId = null,
        [FromQuery] string? category = null,
        [FromQuery] string? lotNumber = null)
    {
        var stock = await _inventoryService.GetStockAsync(warehouseId, itemId, category, lotNumber);
        return Ok(stock);
    }

    /// <summary>
    /// Obtiene el resumen consolidado de existencias por artículo a nivel global de la empresa.
    /// </summary>
    [HttpGet("stock/summary")]
    public async Task<ActionResult<IEnumerable<InventoryStockSummaryDto>>> GetStockSummary(
        [FromQuery] string? category = null)
    {
        var summary = await _inventoryService.GetStockSummaryAsync(category);
        return Ok(summary);
    }

    /// <summary>
    /// Consulta el Kardex inmutable de transacciones históricas (entradas, salidas, transferencias).
    /// </summary>
    [HttpGet("kardex")]
    public async Task<ActionResult<IEnumerable<InventoryTransactionResponseDto>>> GetKardex(
        [FromQuery] int? itemId = null,
        [FromQuery] int? warehouseId = null,
        [FromQuery] string? transactionType = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var kardex = await _inventoryService.GetKardexAsync(itemId, warehouseId, transactionType, fromDate, toDate);
        return Ok(kardex);
    }

    /// <summary>
    /// Realiza una transferencia de inventario entre almacenes (ej. ALM-001 a ALM-002) con bloqueo estricto por stock insuficiente.
    /// </summary>
    [HttpPost("transfer")]
    public async Task<ActionResult<InventoryTransactionResponseDto>> TransferStock([FromBody] TransferStockRequestDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "Operador Almacén";
            var result = await _inventoryService.TransferStockAsync(dto, user);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al procesar transferencia de inventario.");
            return StatusCode(500, new { message = "Ocurrió un error interno al realizar la transferencia." });
        }
    }

    /// <summary>
    /// Registra un ajuste de inventario (entrada por conteo físico o salida por merma/desecho).
    /// </summary>
    [HttpPost("adjust")]
    public async Task<ActionResult<InventoryTransactionResponseDto>> AdjustStock([FromBody] AdjustStockRequestDto dto)
    {
        try
        {
            var user = User.Identity?.Name ?? "Control Almacén";
            var result = await _inventoryService.AdjustStockAsync(dto, user);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al procesar ajuste de inventario.");
            return StatusCode(500, new { message = "Ocurrió un error interno al procesar el ajuste." });
        }
    }
}
