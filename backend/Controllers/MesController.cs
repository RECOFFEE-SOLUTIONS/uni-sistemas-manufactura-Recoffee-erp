using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MesController : ControllerBase
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<MesController> _logger;

    public MesController(ReCoffeeDbContext context, ILogger<MesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene las operaciones de ruta (RO-1 a RO-8) y su estado de ejecución en piso de planta para una orden de producción.
    /// Si la orden aún no tiene sus operaciones instanciadas, las genera automáticamente a partir de su hoja de ruta estándar.
    /// </summary>
    [HttpGet("orders/{orderId:int}/operations")]
    public async Task<ActionResult<ProductionOrderMesDetailDto>> GetOrderOperations(int orderId)
    {
        var order = await _context.ProductionOrders
            .Include(p => p.Item)
            .Include(p => p.Operations)
            .FirstOrDefaultAsync(p => p.Id == orderId);

        if (order == null)
        {
            return NotFound(new { message = $"No se encontró la orden de producción con ID {orderId}." });
        }

        // Si la orden aún no tiene operaciones instanciadas, generarlas a partir de su ruta estándar
        if (!order.Operations.Any())
        {
            await InitializeOperationsForOrderAsync(order);
        }

        var operations = await _context.ProductionOrderOperations
            .Where(o => o.ProductionOrderId == orderId)
            .OrderBy(o => o.SequenceOrder)
            .ToListAsync();

        int totalCount = operations.Count;
        int completedCount = operations.Count(o => o.Status == "Completado");
        decimal progress = totalCount > 0 ? Math.Round((decimal)completedCount / totalCount * 100m, 2) : 0m;

        var result = new ProductionOrderMesDetailDto
        {
            ProductionOrderId = order.Id,
            OrderNumber = order.OrderNumber,
            ItemCode = order.Item?.Code ?? "PT",
            ItemName = order.Item?.Name ?? "Producto",
            PlannedQuantity = order.PlannedQuantity,
            ProducedQuantity = order.ProducedQuantity,
            UnitOfMeasure = order.UnitOfMeasure,
            Status = order.Status,
            LotNumber = order.LotNumber,
            PlannedStartDate = order.PlannedStartDate,
            ActualStartDate = order.ActualStartDate,
            ActualEndDate = order.ActualEndDate,
            TotalOperationsCount = totalCount,
            CompletedOperationsCount = completedCount,
            ProgressPercentage = progress,
            Operations = operations.Select(o => MapToOperationDto(o, order.OrderNumber)).ToList()
        };

        return Ok(result);
    }

    /// <summary>
    /// Consulta el detalle de una operación individual por su ID.
    /// </summary>
    [HttpGet("operations/{id:int}")]
    public async Task<ActionResult<ProductionOrderOperationResponseDto>> GetOperationById(int id)
    {
        var op = await _context.ProductionOrderOperations
            .Include(o => o.ProductionOrder)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (op == null)
        {
            return NotFound(new { message = $"No se encontró la operación con ID {id}." });
        }

        return Ok(MapToOperationDto(op, op.ProductionOrder?.OrderNumber ?? string.Empty));
    }

    /// <summary>
    /// Registra el inicio de una operación en piso de planta por parte del operario (Timestamp y Estado 'Iniciado').
    /// </summary>
    [HttpPost("operations/{id:int}/start")]
    public async Task<ActionResult<ProductionOrderOperationResponseDto>> StartOperation(
        int id,
        [FromBody] StartOperationRequestDto? dto = null)
    {
        var op = await _context.ProductionOrderOperations
            .Include(o => o.ProductionOrder)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (op == null)
        {
            return NotFound(new { message = $"No se encontró la operación con ID {id}." });
        }

        if (op.Status == "Completado")
        {
            return BadRequest(new { message = $"La operación {op.OperationCode} ({op.Name}) ya fue completada anteriormente el {op.CompletedAt:yyyy-MM-dd HH:mm}." });
        }

        DateTime now = dto?.StartedAt ?? DateTime.UtcNow;
        string operatorName = !string.IsNullOrWhiteSpace(dto?.OperatorName)
            ? dto.OperatorName
            : (User.Identity?.Name ?? "Operador de Planta");

        op.Status = "Iniciado";
        op.StartedAt = now;
        op.ExecutedBy = operatorName;
        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            op.OperatorNotes = string.IsNullOrWhiteSpace(op.OperatorNotes)
                ? dto.Notes
                : $"{op.OperatorNotes} | Inicio: {dto.Notes}";
        }

        // Si la orden de producción padre estaba en estado 'Planificada', activarla a 'En Proceso'
        if (op.ProductionOrder != null && op.ProductionOrder.Status == "Planificada")
        {
            op.ProductionOrder.Status = "En Proceso";
            op.ProductionOrder.ActualStartDate = now;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Operación {OpCode} ({OpName}) de OP {OrderNumber} iniciada por {Operator} a las {Timestamp}",
            op.OperationCode, op.Name, op.ProductionOrder?.OrderNumber, operatorName, now);

        return Ok(MapToOperationDto(op, op.ProductionOrder?.OrderNumber ?? string.Empty));
    }

    /// <summary>
    /// Registra la finalización de una operación en piso de planta por parte del operario (Timestamp, cálculo de minutos reales y Estado 'Completado').
    /// </summary>
    [HttpPost("operations/{id:int}/complete")]
    public async Task<ActionResult<ProductionOrderOperationResponseDto>> CompleteOperation(
        int id,
        [FromBody] CompleteOperationRequestDto? dto = null)
    {
        var op = await _context.ProductionOrderOperations
            .Include(o => o.ProductionOrder)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (op == null)
        {
            return NotFound(new { message = $"No se encontró la operación con ID {id}." });
        }

        if (op.Status == "Completado")
        {
            return BadRequest(new { message = $"La operación {op.OperationCode} ya se encuentra completada." });
        }

        DateTime completedTime = dto?.CompletedAt ?? DateTime.UtcNow;
        DateTime startTime = op.StartedAt ?? completedTime.AddMinutes(-(double)(op.StandardLaborMinutes + op.StandardMachineMinutes + op.StandardPassiveMinutes > 0 ? (op.StandardLaborMinutes + op.StandardMachineMinutes + op.StandardPassiveMinutes) : 15m));

        decimal elapsedMinutes = Math.Max(0.5m, Math.Round((decimal)(completedTime - startTime).TotalMinutes, 2));

        op.Status = "Completado";
        op.StartedAt = startTime;
        op.CompletedAt = completedTime;

        if (dto?.ActualLaborMinutes.HasValue == true)
        {
            op.ActualLaborMinutes = dto.ActualLaborMinutes.Value;
        }
        else
        {
            op.ActualLaborMinutes = op.StandardLaborMinutes > 0 ? op.StandardLaborMinutes : elapsedMinutes;
        }

        if (dto?.ActualMachineMinutes.HasValue == true)
        {
            op.ActualMachineMinutes = dto.ActualMachineMinutes.Value;
        }
        else
        {
            op.ActualMachineMinutes = op.StandardMachineMinutes;
        }

        if (dto?.ActualPassiveMinutes.HasValue == true)
        {
            op.ActualPassiveMinutes = dto.ActualPassiveMinutes.Value;
        }
        else
        {
            op.ActualPassiveMinutes = op.StandardPassiveMinutes;
        }

        op.TotalActualMinutes = op.ActualLaborMinutes + op.ActualMachineMinutes + op.ActualPassiveMinutes;

        if (!string.IsNullOrWhiteSpace(dto?.OperatorName))
        {
            op.ExecutedBy = dto.OperatorName;
        }
        else if (string.IsNullOrWhiteSpace(op.ExecutedBy))
        {
            op.ExecutedBy = User.Identity?.Name ?? "Operador de Planta";
        }

        if (!string.IsNullOrWhiteSpace(dto?.Notes))
        {
            op.OperatorNotes = string.IsNullOrWhiteSpace(op.OperatorNotes)
                ? dto.Notes
                : $"{op.OperatorNotes} | Fin: {dto.Notes}";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Operación {OpCode} ({OpName}) de OP {OrderNumber} completada. Duración: {Minutes} min. Operario: {Operator}",
            op.OperationCode, op.Name, op.ProductionOrder?.OrderNumber, op.TotalActualMinutes, op.ExecutedBy);

        return Ok(MapToOperationDto(op, op.ProductionOrder?.OrderNumber ?? string.Empty));
    }

    private async Task InitializeOperationsForOrderAsync(ProductionOrder order)
    {
        // Buscar ruta asociada a la OP o al artículo fabricado
        RoutingHeader? routing = null;
        if (order.RoutingHeaderId.HasValue)
        {
            routing = await _context.RoutingHeaders
                .Include(r => r.Operations)
                .FirstOrDefaultAsync(r => r.Id == order.RoutingHeaderId.Value);
        }

        if (routing == null)
        {
            routing = await _context.RoutingHeaders
                .Include(r => r.Operations)
                .FirstOrDefaultAsync(r => r.ItemId == order.ItemId && r.IsActive);
        }

        if (routing == null || !routing.Operations.Any())
        {
            // Si no tiene ruta explícita, buscar cualquier ruta activa general de ReCoffee
            routing = await _context.RoutingHeaders
                .Include(r => r.Operations)
                .FirstOrDefaultAsync(r => r.IsActive);
        }

        if (routing != null && routing.Operations.Any())
        {
            var sortedOps = routing.Operations.OrderBy(o => o.SequenceOrder).ToList();
            foreach (var rOp in sortedOps)
            {
                var newOp = new ProductionOrderOperation
                {
                    ProductionOrderId = order.Id,
                    RoutingOperationId = rOp.Id,
                    SequenceOrder = rOp.SequenceOrder,
                    OperationCode = rOp.OperationCode,
                    Name = rOp.Name,
                    WorkCenter = rOp.WorkCenter,
                    Status = order.Status == "Completada" ? "Completado" : "Pendiente",
                    StandardLaborMinutes = rOp.LaborMinutes,
                    StandardMachineMinutes = rOp.MachineMinutes,
                    StandardPassiveMinutes = rOp.PassiveProcessMinutes,
                    ActualLaborMinutes = order.Status == "Completada" ? rOp.LaborMinutes : 0m,
                    ActualMachineMinutes = order.Status == "Completada" ? rOp.MachineMinutes : 0m,
                    ActualPassiveMinutes = order.Status == "Completada" ? rOp.PassiveProcessMinutes : 0m,
                    TotalActualMinutes = order.Status == "Completada" ? (rOp.LaborMinutes + rOp.MachineMinutes + rOp.PassiveProcessMinutes) : 0m,
                    StartedAt = order.Status == "Completada" ? (order.ActualStartDate ?? order.CreatedAt) : null,
                    CompletedAt = order.Status == "Completada" ? (order.ActualEndDate ?? order.CreatedAt.AddHours(32)) : null,
                    IsQualityCheck = rOp.IsQualityCheck,
                    RequiresIIoTTelemetry = rOp.RequiresIIoTTelemetry,
                    ExecutedBy = order.Status == "Completada" ? "Operario Certificado" : null,
                    OperatorNotes = order.Status == "Completada" ? "Operación ejecutada conforme a estándares." : null,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProductionOrderOperations.Add(newOp);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Se inicializaron {Count} operaciones de ruta para OP {OrderNumber}",
                routing.Operations.Count, order.OrderNumber);
        }
    }

    private static ProductionOrderOperationResponseDto MapToOperationDto(ProductionOrderOperation o, string orderNumber)
    {
        return new ProductionOrderOperationResponseDto
        {
            Id = o.Id,
            ProductionOrderId = o.ProductionOrderId,
            OrderNumber = orderNumber,
            RoutingOperationId = o.RoutingOperationId,
            SequenceOrder = o.SequenceOrder,
            OperationCode = o.OperationCode,
            Name = o.Name,
            WorkCenter = o.WorkCenter,
            Status = o.Status,
            StandardLaborMinutes = o.StandardLaborMinutes,
            StandardMachineMinutes = o.StandardMachineMinutes,
            StandardPassiveMinutes = o.StandardPassiveMinutes,
            StartedAt = o.StartedAt,
            CompletedAt = o.CompletedAt,
            ActualLaborMinutes = o.ActualLaborMinutes,
            ActualMachineMinutes = o.ActualMachineMinutes,
            ActualPassiveMinutes = o.ActualPassiveMinutes,
            TotalActualMinutes = o.TotalActualMinutes,
            IsQualityCheck = o.IsQualityCheck,
            RequiresIIoTTelemetry = o.RequiresIIoTTelemetry,
            ExecutedBy = o.ExecutedBy,
            OperatorNotes = o.OperatorNotes
        };
    }
}
