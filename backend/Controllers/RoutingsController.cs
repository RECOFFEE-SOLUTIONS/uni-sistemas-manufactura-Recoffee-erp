using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoutingsController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<RoutingsController> _logger;

    public RoutingsController(ReCoffeeDbContext context, ILogger<RoutingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lista todas las rutas de producción registradas en el sistema.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetRoutings()
    {
        var routings = await _context.RoutingHeaders
            .AsNoTracking()
            .Include(r => r.Item)
            .Include(r => r.Operations)
            .OrderBy(r => r.Code)
            .Select(r => new
            {
                r.Id,
                r.Code,
                r.Name,
                r.ItemId,
                ItemCode = r.Item != null ? r.Item.Code : string.Empty,
                ItemName = r.Item != null ? r.Item.Name : string.Empty,
                r.Version,
                r.Description,
                r.IsActive,
                r.TotalLaborMinutes,
                r.TotalMachineMinutes,
                r.TotalPassiveProcessMinutes,
                r.TotalCycleMinutes,
                OperationsCount = r.Operations.Count,
                Operations = r.Operations.OrderBy(o => o.SequenceOrder).Select(o => new
                {
                    o.Id,
                    o.RoutingHeaderId,
                    o.SequenceOrder,
                    o.OperationCode,
                    o.Name,
                    o.Description,
                    o.WorkCenter,
                    o.LaborMinutes,
                    o.MachineMinutes,
                    o.PassiveProcessMinutes,
                    o.SetupMinutes,
                    o.IsQualityCheck,
                    o.RequiresIIoTTelemetry,
                    o.StandardInstructions
                }).ToList(),
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(routings);
    }

    /// <summary>
    /// Obtiene el detalle de una ruta de producción por su ID con todas sus operaciones secuenciales.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetRoutingById(int id)
    {
        var routing = await _context.RoutingHeaders
            .AsNoTracking()
            .Include(r => r.Item)
            .Include(r => r.Operations)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (routing == null)
        {
            return NotFound(new { message = $"No se encontró la ruta de producción con ID {id}." });
        }

        var result = new
        {
            routing.Id,
            routing.Code,
            routing.Name,
            routing.ItemId,
            ItemCode = routing.Item != null ? routing.Item.Code : string.Empty,
            ItemName = routing.Item != null ? routing.Item.Name : string.Empty,
            routing.Version,
            routing.Description,
            routing.IsActive,
            routing.TotalLaborMinutes,
            routing.TotalMachineMinutes,
            routing.TotalPassiveProcessMinutes,
            routing.TotalCycleMinutes,
            routing.CreatedAt,
            Operations = routing.Operations.OrderBy(o => o.SequenceOrder).Select(o => new
            {
                o.Id,
                o.RoutingHeaderId,
                o.SequenceOrder,
                o.OperationCode,
                o.Name,
                o.Description,
                o.WorkCenter,
                o.LaborMinutes,
                o.MachineMinutes,
                o.PassiveProcessMinutes,
                o.SetupMinutes,
                o.IsQualityCheck,
                o.RequiresIIoTTelemetry,
                o.StandardInstructions
            }).ToList()
        };

        return Ok(result);
    }

    /// <summary>
    /// Obtiene la ruta de producción activa asociada a un artículo específico.
    /// </summary>
    [HttpGet("by-item/{itemId:int}")]
    public async Task<ActionResult<object>> GetRoutingByItemId(int itemId)
    {
        var routing = await _context.RoutingHeaders
            .AsNoTracking()
            .Include(r => r.Item)
            .Include(r => r.Operations)
            .FirstOrDefaultAsync(r => r.ItemId == itemId && r.IsActive);

        if (routing == null)
        {
            return NotFound(new { message = $"El artículo con ID {itemId} no tiene una ruta de producción activa." });
        }

        var result = new
        {
            routing.Id,
            routing.Code,
            routing.Name,
            routing.ItemId,
            ItemCode = routing.Item != null ? routing.Item.Code : string.Empty,
            ItemName = routing.Item != null ? routing.Item.Name : string.Empty,
            routing.Version,
            routing.Description,
            routing.IsActive,
            routing.TotalLaborMinutes,
            routing.TotalMachineMinutes,
            routing.TotalPassiveProcessMinutes,
            routing.TotalCycleMinutes,
            routing.CreatedAt,
            Operations = routing.Operations.OrderBy(o => o.SequenceOrder).Select(o => new
            {
                o.Id,
                o.RoutingHeaderId,
                o.SequenceOrder,
                o.OperationCode,
                o.Name,
                o.Description,
                o.WorkCenter,
                o.LaborMinutes,
                o.MachineMinutes,
                o.PassiveProcessMinutes,
                o.SetupMinutes,
                o.IsQualityCheck,
                o.RequiresIIoTTelemetry,
                o.StandardInstructions
            }).ToList()
        };

        return Ok(result);
    }
}
