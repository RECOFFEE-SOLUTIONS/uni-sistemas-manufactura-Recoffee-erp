using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(ReCoffeeDbContext context, ILogger<SuppliersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/suppliers
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Supplier>>> GetSuppliers([FromQuery] bool? activeOnly)
    {
        var query = _context.Suppliers.AsNoTracking();

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(s => s.IsActive);
        }

        var suppliers = await query.OrderBy(s => s.Code).ToListAsync();
        return Ok(suppliers);
    }

    // GET: api/suppliers/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Supplier>> GetSupplier(int id)
    {
        var supplier = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (supplier == null)
        {
            return NotFound(new { message = $"Proveedor con ID {id} no fue encontrado." });
        }
        return Ok(supplier);
    }

    // POST: api/suppliers
    [HttpPost]
    public async Task<ActionResult<Supplier>> CreateSupplier([FromBody] Supplier supplier)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        supplier.Code = supplier.Code.Trim().ToUpperInvariant();

        if (await _context.Suppliers.AnyAsync(s => s.Code == supplier.Code))
        {
            return Conflict(new { message = $"El código de proveedor '{supplier.Code}' ya se encuentra registrado." });
        }

        try
        {
            supplier.CreatedAt = DateTime.UtcNow;
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al crear proveedor con código {Code}", supplier.Code);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de proveedor '{supplier.Code}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad de datos al crear el proveedor." });
        }
    }

    // PUT: api/suppliers/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSupplier(int id, [FromBody] Supplier supplier)
    {
        if (id != supplier.Id)
        {
            return BadRequest(new { message = "El ID de la ruta no coincide con el cuerpo de la solicitud." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existing = await _context.Suppliers.FindAsync(id);
        if (existing == null)
        {
            return NotFound(new { message = $"Proveedor con ID {id} no fue encontrado." });
        }

        var normalizedCode = supplier.Code.Trim().ToUpperInvariant();

        if (existing.Code != normalizedCode && await _context.Suppliers.AnyAsync(s => s.Code == normalizedCode && s.Id != id))
        {
            return Conflict(new { message = $"El código de proveedor '{normalizedCode}' ya está siendo utilizado por otro proveedor." });
        }

        existing.Code = normalizedCode;
        existing.Name = supplier.Name.Trim();
        existing.ContactName = supplier.ContactName;
        existing.Email = supplier.Email;
        existing.Phone = supplier.Phone;
        existing.Address = supplier.Address;
        existing.IsActive = supplier.IsActive;

        try
        {
            await _context.SaveChangesAsync();
            return Ok(existing);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al actualizar proveedor con ID {Id}", id);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de proveedor '{normalizedCode}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad al actualizar el proveedor." });
        }
    }

    // DELETE: api/suppliers/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSupplier(int id)
    {
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(new { message = $"Proveedor con ID {id} no fue encontrado." });
        }

        try
        {
            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Proveedor '{supplier.Code}' eliminado exitosamente." });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "No se pudo eliminar el proveedor {Id} por dependencias relacionales (Compras). Se desactiva lógicamente.", id);
            supplier.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"El proveedor '{supplier.Code}' posee órdenes registradas y ha sido desactivado lógicamente." });
        }
    }
}
