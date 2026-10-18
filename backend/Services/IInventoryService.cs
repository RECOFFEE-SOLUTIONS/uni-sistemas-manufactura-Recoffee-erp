using backend.DTOs;

namespace backend.Services;

public interface IInventoryService
{
    Task<IEnumerable<InventoryStockResponseDto>> GetStockAsync(int? warehouseId, int? itemId, string? category, string? lotNumber);
    Task<IEnumerable<InventoryStockSummaryDto>> GetStockSummaryAsync(string? category);
    Task<IEnumerable<InventoryTransactionResponseDto>> GetKardexAsync(int? itemId, int? warehouseId, string? transactionType, DateTime? fromDate, DateTime? toDate);
    Task<InventoryTransactionResponseDto> TransferStockAsync(TransferStockRequestDto dto, string? performedBy);
    Task<InventoryTransactionResponseDto> AdjustStockAsync(AdjustStockRequestDto dto, string? performedBy);
}
