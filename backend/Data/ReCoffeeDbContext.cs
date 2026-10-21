using backend.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class ReCoffeeDbContext : IdentityDbContext
{
    public ReCoffeeDbContext(DbContextOptions<ReCoffeeDbContext> options)
        : base(options)
    {
    }

    public DbSet<Warehouse> Warehouses { get; set; } = null!;
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<Supplier> Suppliers { get; set; } = null!;
    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<BomHeader> BomHeaders { get; set; } = null!;
    public DbSet<BomComponent> BomComponents { get; set; } = null!;
    public DbSet<RoutingHeader> RoutingHeaders { get; set; } = null!;
    public DbSet<RoutingOperation> RoutingOperations { get; set; } = null!;
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; } = null!;
    public DbSet<PurchaseOrderLine> PurchaseOrderLines { get; set; } = null!;
    public DbSet<InventoryStock> InventoryStocks { get; set; } = null!;
    public DbSet<InventoryLot> InventoryLots { get; set; } = null!;
    public DbSet<InventoryMovement> InventoryMovements { get; set; } = null!;
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; } = null!;
    public DbSet<ProductionOrder> ProductionOrders { get; set; } = null!;
    public DbSet<ProductionOrderMaterial> ProductionOrderMaterials { get; set; } = null!;
    public DbSet<SalesOrder> SalesOrders { get; set; } = null!;
    public DbSet<SalesOrderLine> SalesOrderLines { get; set; } = null!;
    public DbSet<ProductionOrderOperation> ProductionOrderOperations { get; set; } = null!;
    public DbSet<QualityInspection> QualityInspections { get; set; } = null!;
    public DbSet<NonConformanceReport> NonConformanceReports { get; set; } = null!;
    public DbSet<IiotTelemetryLog> IiotTelemetryLogs { get; set; } = null!;
    public DbSet<AccessLog> AccessLogs { get; set; } = null!;
    public DbSet<UserModulePermission> UserModulePermissions { get; set; } = null!;
    public DbSet<UserSecurityProfile> UserSecurityProfiles { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // 1. Warehouse: Código único
        builder.Entity<Warehouse>(entity =>
        {
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_Warehouses_Code");
        });

        // 2. Item: Código único y precisión de costos
        builder.Entity<Item>(entity =>
        {
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_Items_Code");

            entity.Property(e => e.Cost)
                  .HasPrecision(18, 4);

            entity.Property(e => e.StandardCost)
                  .HasPrecision(18, 4);
        });

        // 3. Supplier: Código único
        builder.Entity<Supplier>(entity =>
        {
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_Suppliers_Code");
        });

        // 4. Customer: Código único
        builder.Entity<Customer>(entity =>
        {
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_Customers_Code");
        });

        // 5. BomHeader: Código único y relación con Item Padre
        builder.Entity<BomHeader>(entity =>
        {
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_BomHeaders_Code");

            entity.Property(e => e.BaseQuantity)
                  .HasPrecision(18, 4);

            entity.HasOne(e => e.ParentItem)
                  .WithMany()
                  .HasForeignKey(e => e.ParentItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 6. BomComponent: Precisiones y relaciones con Cabecera e Item Componente
        builder.Entity<BomComponent>(entity =>
        {
            entity.Property(e => e.Quantity)
                  .HasPrecision(18, 4);

            entity.Property(e => e.ScrapPercentage)
                  .HasPrecision(18, 4);

            entity.HasOne(e => e.BomHeader)
                  .WithMany(b => b.Components)
                  .HasForeignKey(e => e.BomHeaderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ComponentItem)
                  .WithMany()
                  .HasForeignKey(e => e.ComponentItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 7. RoutingHeader: Código único y relación con Item
        builder.Entity<RoutingHeader>(entity =>
        {
            entity.HasIndex(e => e.Code)
                  .IsUnique()
                  .HasDatabaseName("IX_RoutingHeaders_Code");

            entity.Property(e => e.TotalLaborMinutes).HasPrecision(18, 2);
            entity.Property(e => e.TotalMachineMinutes).HasPrecision(18, 2);
            entity.Property(e => e.TotalPassiveProcessMinutes).HasPrecision(18, 2);
            entity.Property(e => e.TotalCycleMinutes).HasPrecision(18, 2);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 8. RoutingOperation: Precisiones y relación con Cabecera
        builder.Entity<RoutingOperation>(entity =>
        {
            entity.Property(e => e.LaborMinutes).HasPrecision(18, 2);
            entity.Property(e => e.MachineMinutes).HasPrecision(18, 2);
            entity.Property(e => e.PassiveProcessMinutes).HasPrecision(18, 2);
            entity.Property(e => e.SetupMinutes).HasPrecision(18, 2);

            entity.HasOne(e => e.RoutingHeader)
                  .WithMany(r => r.Operations)
                  .HasForeignKey(e => e.RoutingHeaderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 9. PurchaseOrder: Número de orden único y relación con Proveedor
        builder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasIndex(e => e.OrderNumber)
                  .IsUnique()
                  .HasDatabaseName("IX_PurchaseOrders_OrderNumber");

            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);

            entity.HasOne(e => e.Supplier)
                  .WithMany()
                  .HasForeignKey(e => e.SupplierId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 10. PurchaseOrderLine: Relación con Orden e Item
        builder.Entity<PurchaseOrderLine>(entity =>
        {
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.ReceivedQuantity).HasPrecision(18, 4);

            entity.HasOne(e => e.PurchaseOrder)
                  .WithMany(o => o.Lines)
                  .HasForeignKey(e => e.PurchaseOrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 11. InventoryStock: Balance físico agrupado por artículo, almacén y lote
        builder.Entity<InventoryStock>(entity =>
        {
            entity.HasIndex(e => new { e.WarehouseId, e.ItemId, e.LotNumber })
                  .IsUnique()
                  .HasDatabaseName("IX_InventoryStocks_Warehouse_Item_Lot");

            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.ReservedQuantity).HasPrecision(18, 4);

            entity.HasOne(e => e.Warehouse)
                  .WithMany()
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 12. InventoryLot: Trazabilidad por número de lote único
        builder.Entity<InventoryLot>(entity =>
        {
            entity.HasIndex(e => e.LotNumber)
                  .IsUnique()
                  .HasDatabaseName("IX_InventoryLots_LotNumber");

            entity.Property(e => e.InitialQuantity).HasPrecision(18, 4);
            entity.Property(e => e.CurrentQuantity).HasPrecision(18, 4);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Warehouse)
                  .WithMany()
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PurchaseOrder)
                  .WithMany()
                  .HasForeignKey(e => e.PurchaseOrderId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // 13. InventoryMovement: Movimientos de inventario legacy
        builder.Entity<InventoryMovement>(entity =>
        {
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitCost).HasPrecision(18, 4);
            entity.Property(e => e.TotalCost).HasPrecision(18, 2);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Warehouse)
                  .WithMany()
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 14. InventoryTransaction: Kardex inmutable para todas las transacciones (entradas, salidas, transferencias)
        builder.Entity<InventoryTransaction>(entity =>
        {
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitCost).HasPrecision(18, 4);
            entity.Property(e => e.TotalCost).HasPrecision(18, 2);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SourceWarehouse)
                  .WithMany()
                  .HasForeignKey(e => e.SourceWarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DestinationWarehouse)
                  .WithMany()
                  .HasForeignKey(e => e.DestinationWarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 15. ProductionOrder: Número de orden único y relaciones con Item, BOM y Ruta
        builder.Entity<ProductionOrder>(entity =>
        {
            entity.HasIndex(e => e.OrderNumber)
                  .IsUnique()
                  .HasDatabaseName("IX_ProductionOrders_OrderNumber");

            entity.Property(e => e.PlannedQuantity).HasPrecision(18, 4);
            entity.Property(e => e.ProducedQuantity).HasPrecision(18, 4);
            entity.Property(e => e.ScrapQuantity).HasPrecision(18, 4);
            entity.Property(e => e.TotalEstimatedCost).HasPrecision(18, 2);
            entity.Property(e => e.TotalActualCost).HasPrecision(18, 2);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.BomHeader)
                  .WithMany()
                  .HasForeignKey(e => e.BomHeaderId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.RoutingHeader)
                  .WithMany()
                  .HasForeignKey(e => e.RoutingHeaderId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // 16. ProductionOrderMaterial: Materiales a consumir y almacenes origen/WIP
        builder.Entity<ProductionOrderMaterial>(entity =>
        {
            entity.Property(e => e.RequiredQuantity).HasPrecision(18, 4);
            entity.Property(e => e.ConsumedQuantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitCost).HasPrecision(18, 4);
            entity.Property(e => e.TotalCost).HasPrecision(18, 2);

            entity.HasOne(e => e.ProductionOrder)
                  .WithMany(p => p.Materials)
                  .HasForeignKey(e => e.ProductionOrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SourceWarehouse)
                  .WithMany()
                  .HasForeignKey(e => e.SourceWarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.WipWarehouse)
                  .WithMany()
                  .HasForeignKey(e => e.WipWarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 17. SalesOrder: Número de orden único y relación con Cliente
        builder.Entity<SalesOrder>(entity =>
        {
            entity.HasIndex(e => e.OrderNumber)
                  .IsUnique()
                  .HasDatabaseName("IX_SalesOrders_OrderNumber");

            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);

            entity.HasOne(e => e.Customer)
                  .WithMany()
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 18. SalesOrderLine: Relación con Orden de Venta e Item
        builder.Entity<SalesOrderLine>(entity =>
        {
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.DispatchedQuantity).HasPrecision(18, 4);

            entity.HasOne(e => e.SalesOrder)
                  .WithMany(s => s.Lines)
                  .HasForeignKey(e => e.SalesOrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 19. ProductionOrderOperation: Seguimiento en piso de planta de operaciones RO-1 a RO-8
        builder.Entity<ProductionOrderOperation>(entity =>
        {
            entity.Property(e => e.StandardLaborMinutes).HasPrecision(18, 2);
            entity.Property(e => e.StandardMachineMinutes).HasPrecision(18, 2);
            entity.Property(e => e.StandardPassiveMinutes).HasPrecision(18, 2);
            entity.Property(e => e.ActualLaborMinutes).HasPrecision(18, 2);
            entity.Property(e => e.ActualMachineMinutes).HasPrecision(18, 2);
            entity.Property(e => e.ActualPassiveMinutes).HasPrecision(18, 2);
            entity.Property(e => e.TotalActualMinutes).HasPrecision(18, 2);

            entity.HasOne(e => e.ProductionOrder)
                  .WithMany(p => p.Operations)
                  .HasForeignKey(e => e.ProductionOrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.RoutingOperation)
                  .WithMany()
                  .HasForeignKey(e => e.RoutingOperationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // 20. QualityInspection: Inspección de calidad RO-5
        builder.Entity<QualityInspection>(entity =>
        {
            entity.HasIndex(e => e.InspectionCode)
                  .IsUnique()
                  .HasDatabaseName("IX_QualityInspections_InspectionCode");

            entity.Property(e => e.HumidityPercentage).HasPrecision(18, 2);
            entity.Property(e => e.WeightKg).HasPrecision(18, 2);
            entity.Property(e => e.Ph).HasPrecision(18, 2);

            entity.HasOne(e => e.ProductionOrder)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionOrderId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ProductionOrderOperation)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionOrderOperationId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Item)
                  .WithMany()
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.NonConformanceReport)
                  .WithOne(n => n.QualityInspection)
                  .HasForeignKey<NonConformanceReport>(n => n.QualityInspectionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 21. NonConformanceReport: Reporte de no conformidad (NCR)
        builder.Entity<NonConformanceReport>(entity =>
        {
            entity.HasIndex(e => e.NcrNumber)
                  .IsUnique()
                  .HasDatabaseName("IX_NonConformanceReports_NcrNumber");

            entity.HasOne(e => e.ProductionOrder)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionOrderId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // 22. IiotTelemetryLog: Telemetría de secado solar RO-3
        builder.Entity<IiotTelemetryLog>(entity =>
        {
            entity.HasIndex(e => new { e.LotNumber, e.Timestamp })
                  .HasDatabaseName("IX_IiotTelemetryLogs_LotNumber_Timestamp");

            entity.Property(e => e.TemperatureCelsius).HasPrecision(18, 2);
            entity.Property(e => e.MoisturePercent).HasPrecision(18, 2);

            entity.HasOne(e => e.ProductionOrder)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionOrderId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
