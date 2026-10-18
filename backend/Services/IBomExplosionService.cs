using backend.DTOs;

namespace backend.Services;

public interface IBomExplosionService
{
    Task<BomExplosionResponseDto> ExplodeBomAsync(int itemId, decimal requestedQuantity);
    Task<BomExplosionResponseDto> ExplodeBomByCodeAsync(string itemCode, decimal requestedQuantity);
}
