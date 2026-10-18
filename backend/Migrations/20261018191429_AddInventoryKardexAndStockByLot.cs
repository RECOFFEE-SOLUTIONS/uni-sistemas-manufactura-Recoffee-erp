using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryKardexAndStockByLot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InventoryStocks_Warehouse_Item",
                table: "InventoryStocks");

            migrationBuilder.AddColumn<string>(
                name: "LotNumber",
                table: "InventoryStocks",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "ReservedQuantity",
                table: "InventoryStocks",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "InventoryTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TransactionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TransactionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ItemId = table.Column<int>(type: "integer", nullable: false),
                    SourceWarehouseId = table.Column<int>(type: "integer", nullable: true),
                    DestinationWarehouseId = table.Column<int>(type: "integer", nullable: true),
                    LotNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    UnitCost = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ReferenceNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PerformedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryTransactions_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryTransactions_Warehouses_DestinationWarehouseId",
                        column: x => x.DestinationWarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryTransactions_Warehouses_SourceWarehouseId",
                        column: x => x.SourceWarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryStocks_Warehouse_Item_Lot",
                table: "InventoryStocks",
                columns: new[] { "WarehouseId", "ItemId", "LotNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_DestinationWarehouseId",
                table: "InventoryTransactions",
                column: "DestinationWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_ItemId",
                table: "InventoryTransactions",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_SourceWarehouseId",
                table: "InventoryTransactions",
                column: "SourceWarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InventoryTransactions");

            migrationBuilder.DropIndex(
                name: "IX_InventoryStocks_Warehouse_Item_Lot",
                table: "InventoryStocks");

            migrationBuilder.DropColumn(
                name: "LotNumber",
                table: "InventoryStocks");

            migrationBuilder.DropColumn(
                name: "ReservedQuantity",
                table: "InventoryStocks");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryStocks_Warehouse_Item",
                table: "InventoryStocks",
                columns: new[] { "WarehouseId", "ItemId" },
                unique: true);
        }
    }
}
