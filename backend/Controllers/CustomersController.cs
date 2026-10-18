using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ReCoffeeDbContext context, ILogger<CustomersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/customers
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers([FromQuery] bool? activeOnly)
    {
        var query = _context.Customers.AsNoTracking();

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(c => c.IsActive);
        }

        var customers = await query.OrderBy(c => c.Code).ToListAsync();
        return Ok(customers);
    }

    // GET: api/customers/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Customer>> GetCustomer(int id)
    {
        var customer = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (customer == null)
        {
            return NotFound(new { message = $"Cliente con ID {id} no fue encontrado." });
        }
        return Ok(customer);
    }

    // POST: api/customers
    [HttpPost]
    public async Task<ActionResult<Customer>> CreateCustomer([FromBody] Customer customer)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        customer.Code = customer.Code.Trim().ToUpperInvariant();

        if (await _context.Customers.AnyAsync(c => c.Code == customer.Code))
        {
            return Conflict(new { message = $"El código de cliente '{customer.Code}' ya se encuentra registrado." });
        }

        try
        {
            customer.CreatedAt = DateTime.UtcNow;
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al crear cliente con código {Code}", customer.Code);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de cliente '{customer.Code}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad de datos al crear el cliente." });
        }
    }

    // PUT: api/customers/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] Customer customer)
    {
        if (id != customer.Id)
        {
            return BadRequest(new { message = "El ID de la ruta no coincide con el cuerpo de la solicitud." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existing = await _context.Customers.FindAsync(id);
        if (existing == null)
        {
            return NotFound(new { message = $"Cliente con ID {id} no fue encontrado." });
        }

        var normalizedCode = customer.Code.Trim().ToUpperInvariant();

        if (existing.Code != normalizedCode && await _context.Customers.AnyAsync(c => c.Code == normalizedCode && c.Id != id))
        {
            return Conflict(new { message = $"El código de cliente '{normalizedCode}' ya está siendo utilizado por otro cliente." });
        }

        existing.Code = normalizedCode;
        existing.Name = customer.Name.Trim();
        existing.ContactName = customer.ContactName;
        existing.Email = customer.Email;
        existing.Phone = customer.Phone;
        existing.Address = customer.Address;
        existing.IsActive = customer.IsActive;

        try
        {
            await _context.SaveChangesAsync();
            return Ok(existing);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error al actualizar cliente con ID {Id}", id);
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new { message = $"El código de cliente '{normalizedCode}' ya existe en el sistema." });
            }
            return BadRequest(new { message = "Error de integridad al actualizar el cliente." });
        }
    }

    // DELETE: api/customers/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(new { message = $"Cliente con ID {id} no fue encontrado." });
        }

        try
        {
            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Cliente '{customer.Code}' eliminado exitosamente." });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "No se pudo eliminar el cliente {Id} por dependencias relacionales (Ventas). Se desactiva lógicamente.", id);
            customer.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"El cliente '{customer.Code}' posee órdenes registradas y ha sido desactivado lógicamente." });
        }
    }
}
