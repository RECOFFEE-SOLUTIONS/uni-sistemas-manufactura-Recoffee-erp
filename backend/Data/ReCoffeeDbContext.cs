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
    }
}
