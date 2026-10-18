using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionOrdersAndMaterials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductionOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ItemId = table.Column<int>(type: "integer", nullable: false),
                    BomHeaderId = table.Column<int>(type: "integer", nullable: true),
                    RoutingHeaderId = table.Column<int>(type: "integer", nullable: true),
                    PlannedQuantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    ProducedQuantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    ScrapQuantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PlannedStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PlannedEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ActualStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ActualEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    LotNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalEstimatedCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalActualCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionOrders_BomHeaders_BomHeaderId",
                        column: x => x.BomHeaderId,
                        principalTable: "BomHeaders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductionOrders_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductionOrders_RoutingHeaders_RoutingHeaderId",
                        column: x => x.RoutingHeaderId,
                        principalTable: "RoutingHeaders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProductionOrderMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductionOrderId = table.Column<int>(type: "integer", nullable: false),
                    ItemId = table.Column<int>(type: "integer", nullable: false),
                    RequiredQuantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    ConsumedQuantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    UnitCost = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    SourceWarehouseId = table.Column<int>(type: "integer", nullable: true),
                    WipWarehouseId = table.Column<int>(type: "integer", nullable: true),
                    LotNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsConsumed = table.Column<bool>(type: "boolean", nullable: false),
                    ConsumedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionOrderMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionOrderMaterials_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductionOrderMaterials_ProductionOrders_ProductionOrderId",
                        column: x => x.ProductionOrderId,
                        principalTable: "ProductionOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductionOrderMaterials_Warehouses_SourceWarehouseId",
                        column: x => x.SourceWarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductionOrderMaterials_Warehouses_WipWarehouseId",
                        column: x => x.WipWarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrderMaterials_ItemId",
                table: "ProductionOrderMaterials",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrderMaterials_ProductionOrderId",
                table: "ProductionOrderMaterials",
                column: "ProductionOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrderMaterials_SourceWarehouseId",
                table: "ProductionOrderMaterials",
                column: "SourceWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrderMaterials_WipWarehouseId",
                table: "ProductionOrderMaterials",
                column: "WipWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrders_BomHeaderId",
                table: "ProductionOrders",
                column: "BomHeaderId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrders_ItemId",
                table: "ProductionOrders",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrders_OrderNumber",
                table: "ProductionOrders",
                column: "OrderNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductionOrders_RoutingHeaderId",
                table: "ProductionOrders",
                column: "RoutingHeaderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductionOrderMaterials");

            migrationBuilder.DropTable(
                name: "ProductionOrders");
        }
    }
}
