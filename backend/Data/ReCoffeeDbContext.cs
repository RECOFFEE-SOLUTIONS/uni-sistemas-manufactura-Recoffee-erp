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
    }
}
