using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<ItemsController> _logger;

    public ItemsController(ReCoffeeDbContext context, ILogger<ItemsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/items
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Item>>> GetItems(
        [FromQuery] string? category,
        [FromQuery] bool? activeOnly)
    {
        var query = _context.Items.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var cat = category.Trim().ToUpperInvariant();
            query = query.Where(i => i.Category.ToUpper() == cat);
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(i => i.IsActive);
        }

        var items = await query.OrderBy(i => i.Category).ThenBy(i => i.Code).ToListAsync();
        return Ok(items);
    }

    // GET: api/items/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Item>> GetItem(int id)
    {
        var item = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        if (item == null)
        {
            return NotFound(new { message = $"Artículo con ID {id} no fue encontrado." });
        }
        return Ok(item);
    }

    // POST: api/items
    [HttpPost]
    public async Task<ActionResult<Item>> CreateItem([FromBody] Item item)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        item.Code = item.Code.Trim().ToUpperInvariant();
        item.Category = item.Category.Trim().ToUpperInvariant();

        if (item.Cost < 0 || item.StandardCost < 0)
        {
            return BadRequest(new { message = "El costo no puede ser un valor negativo." });
        }

        // Verificación previa de unicidad
        if (await _context.Items.AnyAsync(i => i.Code == item.Code))
        {
            return Conflict(new { message = $"El código de artículo '{item.Code}' ya se encuentra registrado." });
        }

        try
        {
            item.CreatedAt = DateTime.UtcNow;
            _context.Items.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al guardar artículo con código {Code}", item.Code);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de artículo '{item.Code}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad de datos al crear el artículo." });
        }
    }

    // PUT: api/items/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] Item item)
    {
        if (id != item.Id)
        {
            return BadRequest(new { message = "El ID de la ruta no coincide con el cuerpo de la solicitud." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (item.Cost < 0 || item.StandardCost < 0)
        {
            return BadRequest(new { message = "El costo no puede ser un valor negativo." });
        }

        var existing = await _context.Items.FindAsync(id);
        if (existing == null)
        {
            return NotFound(new { message = $"Artículo con ID {id} no fue encontrado." });
        }

        var normalizedCode = item.Code.Trim().ToUpperInvariant();
        var normalizedCat = item.Category.Trim().ToUpperInvariant();

        if (existing.Code != normalizedCode && await _context.Items.AnyAsync(i => i.Code == normalizedCode && i.Id != id))
        {
            return Conflict(new { message = $"El código de artículo '{normalizedCode}' ya está siendo utilizado por otro producto." });
        }

        existing.Code = normalizedCode;
        existing.Name = item.Name.Trim();
        existing.Description = item.Description;
        existing.Category = normalizedCat;
        existing.UnitOfMeasure = item.UnitOfMeasure.Trim();
        existing.Cost = item.Cost;
        existing.StandardCost = item.StandardCost;
        existing.IsActive = item.IsActive;

        try
        {
            await _context.SaveChangesAsync();
            return Ok(existing);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al actualizar artículo con ID {Id}", id);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de artículo '{normalizedCode}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad al actualizar el artículo." });
        }
    }

    // DELETE: api/items/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _context.Items.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { message = $"Artículo con ID {id} no fue encontrado." });
        }

        try
        {
            _context.Items.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Artículo '{item.Code}' eliminado exitosamente." });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "No se pudo eliminar el artículo {Id} por dependencias relacionales (BOM/Inventario). Se desactiva lógicamente.", id);
            item.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"El artículo '{item.Code}' posee movimientos o relaciones activas y ha sido desactivado lógicamente." });
        }
    }
}
