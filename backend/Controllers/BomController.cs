using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BomController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly IBomExplosionService _explosionService;
    private readonly ILogger<BomController> _logger;

    public BomController(
        ReCoffeeDbContext context,
        IBomExplosionService explosionService,
        ILogger<BomController> logger)
    {
        _context = context;
        _explosionService = explosionService;
        _logger = logger;
    }

    /// <summary>
    /// Lista todas las listas de materiales (BOM) registradas.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BomHeaderSummaryDto>>> GetBoms()
    {
        var boms = await _context.BomHeaders
            .AsNoTracking()
            .Include(b => b.ParentItem)
            .Include(b => b.Components)
            .OrderBy(b => b.Code)
            .Select(b => new BomHeaderSummaryDto
            {
                Id = b.Id,
                Code = b.Code,
                ParentItemId = b.ParentItemId,
                ParentItemCode = b.ParentItem != null ? b.ParentItem.Code : string.Empty,
                ParentItemName = b.ParentItem != null ? b.ParentItem.Name : string.Empty,
                Version = b.Version,
                Description = b.Description,
                BaseQuantity = b.BaseQuantity,
                UnitOfMeasure = b.UnitOfMeasure,
                IsActive = b.IsActive,
                ComponentsCount = b.Components.Count,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(boms);
    }

    /// <summary>
    /// Obtiene el detalle de un BOM específico por su ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BomHeader>> GetBomById(int id)
    {
        var bom = await _context.BomHeaders
            .AsNoTracking()
            .Include(b => b.ParentItem)
            .Include(b => b.Components)
                .ThenInclude(c => c.ComponentItem)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bom == null)
        {
            return NotFound(new { message = $"No se encontró la lista de materiales con ID {id}." });
        }

        return Ok(bom);
    }

    /// <summary>
    /// Obtiene el BOM activo asociado a un artículo determinado.
    /// </summary>
    [HttpGet("by-item/{itemId:int}")]
    public async Task<ActionResult<BomHeader>> GetBomByItemId(int itemId)
    {
        var bom = await _context.BomHeaders
            .AsNoTracking()
            .Include(b => b.ParentItem)
            .Include(b => b.Components)
                .ThenInclude(c => c.ComponentItem)
            .FirstOrDefaultAsync(b => b.ParentItemId == itemId && b.IsActive);

        if (bom == null)
        {
            return NotFound(new { message = $"El artículo con ID {itemId} no tiene una lista de materiales activa." });
        }

        return Ok(bom);
    }

    /// <summary>
    /// Realiza la explosión de materiales recursiva (multinivel) para un artículo dado y una cantidad solicitada.
    /// Endpoint: GET /api/bom/{itemId}/explosion?quantity=X
    /// </summary>
    [HttpGet("{itemId:int}/explosion")]
    public async Task<ActionResult<BomExplosionResponseDto>> GetBomExplosion(
        int itemId,
        [FromQuery] decimal quantity = 1.0m)
    {
        try
        {
            if (quantity <= 0)
            {
                return BadRequest(new { message = "La cantidad solicitada debe ser un valor estrictamente mayor a 0." });
            }

            var result = await _explosionService.ExplodeBomAsync(itemId, quantity);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado al calcular la explosión de BOM para itemId: {ItemId}", itemId);
            return StatusCode(500, new { message = "Ocurrió un error interno al procesar la explosión de BOM." });
        }
    }

    /// <summary>
    /// Realiza la explosión de materiales buscando el artículo por su código (ej: PT-001, SEM-001).
    /// Endpoint: GET /api/bom/by-code/{itemCode}/explosion?quantity=X
    /// </summary>
    [HttpGet("by-code/{itemCode}/explosion")]
    public async Task<ActionResult<BomExplosionResponseDto>> GetBomExplosionByCode(
        string itemCode,
        [FromQuery] decimal quantity = 1.0m)
    {
        try
        {
            if (quantity <= 0)
            {
                return BadRequest(new { message = "La cantidad solicitada debe ser un valor estrictamente mayor a 0." });
            }

            var result = await _explosionService.ExplodeBomByCodeAsync(itemCode, quantity);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al calcular la explosión de BOM por código: {ItemCode}", itemCode);
            return StatusCode(500, new { message = "Ocurrió un error interno al procesar la explosión de BOM." });
        }
    }
}
