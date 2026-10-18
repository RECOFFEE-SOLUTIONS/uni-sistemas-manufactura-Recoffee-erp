using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class BomExplosionService : IBomExplosionService
{
    private readonly ReCoffeeDbContext _context;
    private readonly ILogger<BomExplosionService> _logger;

    public BomExplosionService(ReCoffeeDbContext context, ILogger<BomExplosionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<BomExplosionResponseDto> ExplodeBomAsync(int itemId, decimal requestedQuantity)
    {
        if (requestedQuantity <= 0)
        {
            throw new ArgumentException("La cantidad solicitada debe ser un valor mayor a cero.", nameof(requestedQuantity));
        }

        var item = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemId);
        if (item == null)
        {
            throw new KeyNotFoundException($"No se encontró ningún artículo con ID {itemId}.");
        }

        return await BuildExplosionAsync(item, requestedQuantity);
    }

    public async Task<BomExplosionResponseDto> ExplodeBomByCodeAsync(string itemCode, decimal requestedQuantity)
    {
        if (requestedQuantity <= 0)
        {
            throw new ArgumentException("La cantidad solicitada debe ser un valor mayor a cero.", nameof(requestedQuantity));
        }

        var item = await _context.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Code == itemCode);
        if (item == null)
        {
            throw new KeyNotFoundException($"No se encontró ningún artículo con código '{itemCode}'.");
        }

        return await BuildExplosionAsync(item, requestedQuantity);
    }

    private async Task<BomExplosionResponseDto> BuildExplosionAsync(Item targetItem, decimal requestedQuantity)
    {
        // Cargar todas las listas de materiales activas en memoria para navegación multinivel eficiente
        var allActiveBoms = await _context.BomHeaders
            .AsNoTracking()
            .Include(b => b.ParentItem)
            .Include(b => b.Components)
                .ThenInclude(c => c.ComponentItem)
            .Where(b => b.IsActive)
            .ToListAsync();

        var bomByParentItemId = allActiveBoms.ToDictionary(b => b.ParentItemId);

        if (!bomByParentItemId.TryGetValue(targetItem.Id, out var rootBom))
        {
            throw new InvalidOperationException($"El artículo '{targetItem.Code} - {targetItem.Name}' no cuenta con una lista de materiales (BOM) activa.");
        }

        var rootTree = new BomTreeNodeDto
        {
            ItemId = targetItem.Id,
            ItemCode = targetItem.Code,
            ItemName = targetItem.Name,
            Category = targetItem.Category,
            RequiredQuantity = requestedQuantity,
            UnitOfMeasure = rootBom.UnitOfMeasure,
            ScrapPercentage = 0,
            GrossQuantity = requestedQuantity,
            UnitCost = targetItem.Cost,
            SubtotalCost = targetItem.Cost * requestedQuantity,
            Level = 0,
            BomCode = rootBom.Code,
            IsSubassembly = true
        };

        var consolidatedMap = new Dictionary<int, BomExplosionItemDto>();
        var visitedItems = new HashSet<int> { targetItem.Id };

        ExplodeHierarchy(rootTree, rootBom, requestedQuantity, 1, visitedItems, bomByParentItemId, consolidatedMap);

        var consolidatedList = consolidatedMap.Values
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemCode)
            .ToList();

        decimal totalEstimatedCost = consolidatedList.Sum(c => c.TotalCost);

        _logger.LogInformation("Explosión de BOM completada para {ItemCode} x {Quantity}. Componentes consolidados: {Count}, Costo Total: {Cost:C}",
            targetItem.Code, requestedQuantity, consolidatedList.Count, totalEstimatedCost);

        return new BomExplosionResponseDto
        {
            ParentItemId = targetItem.Id,
            ParentItemCode = targetItem.Code,
            ParentItemName = targetItem.Name,
            ParentCategory = targetItem.Category,
            RequestedQuantity = requestedQuantity,
            UnitOfMeasure = rootBom.UnitOfMeasure,
            BomCode = rootBom.Code,
            BomVersion = rootBom.Version,
            BomBaseQuantity = rootBom.BaseQuantity,
            TotalEstimatedCost = totalEstimatedCost,
            CalculationTimestamp = DateTime.UtcNow,
            ConsolidatedMaterials = consolidatedList,
            ExplosionTree = rootTree
        };
    }

    private void ExplodeHierarchy(
        BomTreeNodeDto parentNode,
        BomHeader currentBom,
        decimal parentQuantity,
        int currentLevel,
        HashSet<int> visitedItems,
        Dictionary<int, BomHeader> bomDictionary,
        Dictionary<int, BomExplosionItemDto> consolidatedMap)
    {
        // Factor de escala basado en la cantidad base definida en la cabecera del BOM
        decimal scaleFactor = currentBom.BaseQuantity > 0 ? (parentQuantity / currentBom.BaseQuantity) : parentQuantity;

        foreach (var component in currentBom.Components)
        {
            var componentItem = component.ComponentItem;
            if (componentItem == null) continue;

            decimal requiredQuantity = component.Quantity * scaleFactor;
            decimal scrapPercentage = component.ScrapPercentage;
            decimal grossQuantity = requiredQuantity * (1.0m + (scrapPercentage / 100.0m));
            decimal unitCost = componentItem.Cost;
            decimal subtotalCost = unitCost * requiredQuantity;

            bool isSubassembly = bomDictionary.ContainsKey(componentItem.Id);

            var childNode = new BomTreeNodeDto
            {
                ItemId = componentItem.Id,
                ItemCode = componentItem.Code,
                ItemName = componentItem.Name,
                Category = componentItem.Category,
                RequiredQuantity = requiredQuantity,
                UnitOfMeasure = component.UnitOfMeasure,
                ScrapPercentage = scrapPercentage,
                GrossQuantity = grossQuantity,
                UnitCost = unitCost,
                SubtotalCost = subtotalCost,
                Level = currentLevel,
                BomCode = isSubassembly ? bomDictionary[componentItem.Id].Code : null,
                IsSubassembly = isSubassembly
            };

            parentNode.Children.Add(childNode);

            if (isSubassembly)
            {
                if (visitedItems.Contains(componentItem.Id))
                {
                    throw new InvalidOperationException($"Se detectó una referencia circular en la lista de materiales para el artículo '{componentItem.Code}'.");
                }

                visitedItems.Add(componentItem.Id);
                var subassemblyBom = bomDictionary[componentItem.Id];
                ExplodeHierarchy(childNode, subassemblyBom, requiredQuantity, currentLevel + 1, visitedItems, bomDictionary, consolidatedMap);
                visitedItems.Remove(componentItem.Id);
            }
            else
            {
                // Material terminal (Materia prima o empaque)
                if (consolidatedMap.TryGetValue(componentItem.Id, out var existingItem))
                {
                    existingItem.RequiredQuantity += requiredQuantity;
                    existingItem.GrossQuantity += grossQuantity;
                    existingItem.TotalCost = existingItem.RequiredQuantity * existingItem.UnitCost;
                }
                else
                {
                    consolidatedMap[componentItem.Id] = new BomExplosionItemDto
                    {
                        ItemId = componentItem.Id,
                        ItemCode = componentItem.Code,
                        ItemName = componentItem.Name,
                        Category = componentItem.Category,
                        RequiredQuantity = requiredQuantity,
                        ScrapPercentage = scrapPercentage,
                        GrossQuantity = grossQuantity,
                        UnitOfMeasure = component.UnitOfMeasure,
                        UnitCost = unitCost,
                        TotalCost = subtotalCost,
                        Level = currentLevel
                    };
                }
            }
        }
    }
}
