using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<WarehousesController> _logger;

    public WarehousesController(ReCoffeeDbContext context, ILogger<WarehousesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/warehouses
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Warehouse>>> GetWarehouses([FromQuery] bool? activeOnly)
    {
        var query = _context.Warehouses.AsNoTracking();

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(w => w.IsActive);
        }

        var warehouses = await query.OrderBy(w => w.Code).ToListAsync();
        return Ok(warehouses);
    }

    // GET: api/warehouses/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Warehouse>> GetWarehouse(int id)
    {
        var warehouse = await _context.Warehouses.AsNoTracking().FirstOrDefaultAsync(w => w.Id == id);
        if (warehouse == null)
        {
            return NotFound(new { message = $"Almacén con ID {id} no fue encontrado." });
        }
        return Ok(warehouse);
    }

    // POST: api/warehouses
    [HttpPost]
    public async Task<ActionResult<Warehouse>> CreateWarehouse([FromBody] Warehouse warehouse)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        warehouse.Code = warehouse.Code.Trim().ToUpperInvariant();

        // Verificación previa de unicidad
        if (await _context.Warehouses.AnyAsync(w => w.Code == warehouse.Code))
        {
            return Conflict(new { message = $"El código de almacén '{warehouse.Code}' ya se encuentra registrado." });
        }

        try
        {
            warehouse.CreatedAt = DateTime.UtcNow;
            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al guardar almacén con código {Code}", warehouse.Code);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de almacén '{warehouse.Code}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad de datos al crear el almacén." });
        }
    }

    // PUT: api/warehouses/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] Warehouse warehouse)
    {
        if (id != warehouse.Id)
        {
            return BadRequest(new { message = "El ID de la ruta no coincide con el cuerpo de la solicitud." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existing = await _context.Warehouses.FindAsync(id);
        if (existing == null)
        {
            return NotFound(new { message = $"Almacén con ID {id} no fue encontrado." });
        }

        var normalizedCode = warehouse.Code.Trim().ToUpperInvariant();

        // Verificar si el nuevo código entra en conflicto con otro almacén
        if (existing.Code != normalizedCode && await _context.Warehouses.AnyAsync(w => w.Code == normalizedCode && w.Id != id))
        {
            return Conflict(new { message = $"El código de almacén '{normalizedCode}' ya está siendo utilizado por otro registro." });
        }

        existing.Code = normalizedCode;
        existing.Name = warehouse.Name.Trim();
        existing.Description = warehouse.Description;
        existing.Location = warehouse.Location;
        existing.IsActive = warehouse.IsActive;

        try
        {
            await _context.SaveChangesAsync();
            return Ok(existing);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al actualizar almacén con ID {Id}", id);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de almacén '{normalizedCode}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad al actualizar el almacén." });
        }
    }

    // DELETE: api/warehouses/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWarehouse(int id)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null)
        {
            return NotFound(new { message = $"Almacén con ID {id} no fue encontrado." });
        }

        try
        {
            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Almacén '{warehouse.Code}' eliminado exitosamente." });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "No se pudo eliminar el almacén {Id} por dependencias relacionales. Se desactiva lógicamente.", id);
            warehouse.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"El almacén '{warehouse.Code}' contiene registros vinculados y ha sido desactivado lógicamente." });
        }
    }
}
