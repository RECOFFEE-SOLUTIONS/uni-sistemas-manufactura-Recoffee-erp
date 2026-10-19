using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddQualityInspectionAndNcr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QualityInspections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InspectionCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LotNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProductionOrderId = table.Column<int>(type: "integer", nullable: true),
                    ProductionOrderOperationId = table.Column<int>(type: "integer", nullable: true),
                    ItemId = table.Column<int>(type: "integer", nullable: true),
                    InspectionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    InspectorName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    HumidityPercentage = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    WeightKg = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Appearance = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Ph = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    HasNonConformance = table.Column<bool>(type: "boolean", nullable: false),
                    NonConformanceReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityInspections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QualityInspections_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QualityInspections_ProductionOrderOperations_ProductionOrde~",
                        column: x => x.ProductionOrderOperationId,
                        principalTable: "ProductionOrderOperations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_QualityInspections_ProductionOrders_ProductionOrderId",
                        column: x => x.ProductionOrderId,
                        principalTable: "ProductionOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NonConformanceReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NcrNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QualityInspectionId = table.Column<int>(type: "integer", nullable: false),
                    LotNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProductionOrderId = table.Column<int>(type: "integer", nullable: true),
                    ReportDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Severity = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DefectDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    HumidityDeviation = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    WeightDeviation = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    RootCause = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ProposedAction = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ResponsiblePerson = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NonConformanceReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_ProductionOrders_ProductionOrderId",
                        column: x => x.ProductionOrderId,
                        principalTable: "ProductionOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NonConformanceReports_QualityInspections_QualityInspectionId",
                        column: x => x.QualityInspectionId,
                        principalTable: "QualityInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_NcrNumber",
                table: "NonConformanceReports",
                column: "NcrNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_ProductionOrderId",
                table: "NonConformanceReports",
                column: "ProductionOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_NonConformanceReports_QualityInspectionId",
                table: "NonConformanceReports",
                column: "QualityInspectionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_InspectionCode",
                table: "QualityInspections",
                column: "InspectionCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_ItemId",
                table: "QualityInspections",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_ProductionOrderId",
                table: "QualityInspections",
                column: "ProductionOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityInspections_ProductionOrderOperationId",
                table: "QualityInspections",
                column: "ProductionOrderOperationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NonConformanceReports");

            migrationBuilder.DropTable(
                name: "QualityInspections");
        }
    }
}
