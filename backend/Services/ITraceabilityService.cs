using backend.DTOs;

namespace backend.Services;

public interface ITraceabilityService
{
    Task<LotTraceabilityResponseDto?> GetLotTraceabilityAsync(string lotNumber);
    Task<IEnumerable<TraceableLotSummaryDto>> GetTraceableLotsAsync(string? category = null);
}
