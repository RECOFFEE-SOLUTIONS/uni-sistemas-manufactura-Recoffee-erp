using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class MasterDataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ReCoffeeDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("MasterDataSeeder");

        logger.LogInformation("Iniciando Data Seeder Oficial de ReCoffee Solutions...");

        // 1. Poblado de Almacenes (ALM-001 a ALM-004)
        var warehouses = new List<Warehouse>
        {
            new Warehouse
            {
                Code = "ALM-001",
                Name = "Almacén de Materia Prima (MP)",
                Location = "Nave A - Zona de Recepción",
                Description = "Almacenamiento de pulpa/broza de café y materia orgánica cruda para procesamiento.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Warehouse
            {
                Code = "ALM-002",
                Name = "Almacén de Producción en Proceso (WIP)",
                Location = "Nave B - Área de Manufactura",
                Description = "Materiales y subensambles en transformación activa durante las operaciones de ruta RO-1 a RO-8.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Warehouse
            {
                Code = "ALM-003",
                Name = "Almacén de Producto Terminado (PT)",
                Location = "Nave C - Zona de Despacho",
                Description = "Bolsas de 5kg y Sacos de 25kg de Abono Orgánico certificados listos para venta y distribución.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Warehouse
            {
                Code = "ALM-004",
                Name = "Almacén de Empaques y Cuarentena (EMP/NCR)",
                Location = "Nave A - Zona Lateral",
                Description = "Insumos de empaque, bolsas kraft, etiquetas y lotes en cuarentena / retención de calidad.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var w in warehouses)
        {
            if (!await context.Warehouses.AnyAsync(x => x.Code == w.Code))
            {
                context.Warehouses.Add(w);
                logger.LogInformation("Sembrando Almacén: {Code} - {Name}", w.Code, w.Name);
            }
        }

        // 2. Poblado de Catálogo de Artículos (MP, EMP, SEM, PT)
        var items = new List<Item>
        {
            // Materias Primas (MP)
            new Item
            {
                Code = "MP-001",
                Name = "Borra de Café Seca",
                Category = "MP",
                UnitOfMeasure = "kg",
                Cost = 15.00m,
                StandardCost = 15.00m,
                Description = "Subproducto húmedo del despulpado y borra de café seco de beneficios locales.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Item
            {
                Code = "MP-002",
                Name = "Cáscara de Banano Seca",
                Category = "MP",
                UnitOfMeasure = "kg",
                Cost = 8.50m,
                StandardCost = 8.50m,
                Description = "Aporte esencial de potasio orgánico para la formulación equilibrada de nutrientes.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Item
            {
                Code = "MP-003",
                Name = "Cáscara de Papa Seca",
                Category = "MP",
                UnitOfMeasure = "kg",
                Cost = 6.00m,
                StandardCost = 6.00m,
                Description = "Aporte de fósforo y materia orgánica para el acondicionamiento del suelo.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Item
            {
                Code = "MP-004",
                Name = "Cáscara de Huevo Triturada",
                Category = "MP",
                UnitOfMeasure = "kg",
                Cost = 12.00m,
                StandardCost = 12.00m,
                Description = "Aporte de carbonato de calcio para corrección y balance de acidez en el sustrato.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Insumos de Empaque (EMP)
            new Item
            {
                Code = "EMP-001",
                Name = "Bolsa de Empaque 5 kg",
                Category = "EMP",
                UnitOfMeasure = "unidad",
                Cost = 18.00m,
                StandardCost = 18.00m,
                Description = "Bolsa de papel kraft tricapa biodegradable con barrera antihumedad para empaque de 5kg.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Item
            {
                Code = "EMP-002",
                Name = "Etiqueta ReCoffee Solutions",
                Category = "EMP",
                UnitOfMeasure = "unidad",
                Cost = 4.50m,
                StandardCost = 4.50m,
                Description = "Etiqueta técnica corporativa a color con código de lote, precinto de seguridad e instrucciones.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Item
            {
                Code = "EMP-003",
                Name = "Saco 25 kg",
                Category = "EMP",
                UnitOfMeasure = "unidad",
                Cost = 35.00m,
                StandardCost = 35.00m,
                Description = "Saco industrial kraft multicapa reforzado para presentación de 25kg.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Subensamble / Semielaborado (SEM)
            new Item
            {
                Code = "SEM-001",
                Name = "Mezcla Base",
                Category = "SEM",
                UnitOfMeasure = "kg",
                Cost = 65.75m,
                StandardCost = 65.75m,
                Description = "Subensamble obtenido de mezclar 3.5kg borra de café, 0.5kg banano, 0.5kg papa y 0.5kg huevo.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },

            // Productos Terminados (PT)
            new Item
            {
                Code = "PT-001",
                Name = "Abono Orgánico ReCoffee Bolsa 5 kg",
                Category = "PT",
                UnitOfMeasure = "bolsa",
                Cost = 88.25m,
                StandardCost = 88.25m,
                Description = "Bolsa terminada de 5kg lista para comercialización, sellada y etiquetada.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Item
            {
                Code = "PT-002",
                Name = "Abono Orgánico ReCoffee Saco 25 kg",
                Category = "PT",
                UnitOfMeasure = "saco",
                Cost = 363.75m,
                StandardCost = 363.75m,
                Description = "Saco industrial terminado de 25kg listo para comercialización a gran escala agrícola.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var i in items)
        {
            var existing = await context.Items.FirstOrDefaultAsync(x => x.Code == i.Code);
            if (existing == null)
            {
                context.Items.Add(i);
                logger.LogInformation("Sembrando Artículo: {Code} ({Category}) - {Name}", i.Code, i.Category, i.Name);
            }
            else
            {
                existing.Name = i.Name;
                existing.Description = i.Description;
                existing.UnitOfMeasure = i.UnitOfMeasure;
            }
        }

        // 3. Poblado de Proveedores (PROV-001 a PROV-004)
        var suppliers = new List<Supplier>
        {
            new Supplier
            {
                Code = "PROV-001",
                Name = "Beneficio Central Las Segovias S.A.",
                ContactName = "Ing. Carlos Mendoza",
                Phone = "+505 2772-2345",
                Email = "cmendoza@beneficiosegovias.com.ni",
                Address = "Km 142 Carretera Panamericana Norte, Matagalpa",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Supplier
            {
                Code = "PROV-002",
                Name = "Agropecuaria El Trópico Orgánico",
                ContactName = "Lic. María José Fonseca",
                Phone = "+505 2278-8901",
                Email = "ventas@eltropicoorganico.com",
                Address = "Km 25 Carretera a Masaya, Ticuantepe",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Supplier
            {
                Code = "PROV-003",
                Name = "Empaques Ecológicos de Nicaragua S.A.",
                ContactName = "Lic. Gabriel Morales",
                Phone = "+505 2251-4567",
                Email = "gmorales@empaqueseco.com.ni",
                Address = "Parque Industrial Las Mercedes, Módulo 14, Managua",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Supplier
            {
                Code = "PROV-004",
                Name = "Industrias Gráficas & Etiquetas de C.A.",
                ContactName = "Ing. Patricia Zelaya",
                Phone = "+505 2249-1122",
                Email = "pzelaya@graficasca.com",
                Address = "Zona Industrial Carretera Norte Km 6.5, Managua",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var s in suppliers)
        {
            if (!await context.Suppliers.AnyAsync(x => x.Code == s.Code))
            {
                context.Suppliers.Add(s);
                logger.LogInformation("Sembrando Proveedor: {Code} - {Name}", s.Code, s.Name);
            }
        }

        // 4. Poblado de Clientes (CLI-001 a CLI-004)
        var customers = new List<Customer>
        {
            new Customer
            {
                Code = "CLI-001",
                Name = "Cooperativa de Caficultores del Norte (SOPPEXCCA)",
                ContactName = "Don Ernesto Blandón",
                Phone = "+505 2772-8899",
                Email = "compras@soppexcca.org",
                Address = "Avenida Central, Jinotega",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Customer
            {
                Code = "CLI-002",
                Name = "Supermercados & Distribuidora La Colonia",
                ContactName = "Lic. Andrea Gutiérrez",
                Phone = "+505 2277-3344",
                Email = "proveedores@lacolonia.com.ni",
                Address = "Plaza España, Edificio Corporativo, Managua",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Customer
            {
                Code = "CLI-003",
                Name = "Agroservicios San Francisco S.A.",
                ContactName = "Ing. Fernando Rivas",
                Phone = "+505 2311-6677",
                Email = "frivas@agrosanfrancisco.com",
                Address = "Costado Oeste Parque Central, León",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Customer
            {
                Code = "CLI-004",
                Name = "Viveros y Paisajismo Verde Managua",
                ContactName = "Arq. Sofía Torrez",
                Phone = "+505 2265-9900",
                Email = "storrez@verdemanagua.com",
                Address = "Carretera Sur Km 10.5, Managua",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var c in customers)
        {
            if (!await context.Customers.AnyAsync(x => x.Code == c.Code))
            {
                context.Customers.Add(c);
                logger.LogInformation("Sembrando Cliente: {Code} - {Name}", c.Code, c.Name);
            }
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Data Seeder Oficial de ReCoffee Solutions completado exitosamente.");
    }
}
