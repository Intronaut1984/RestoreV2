using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFreeShippingThresholdToShippingRate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FreeShippingThreshold",
                table: "ShippingRates",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 100m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FreeShippingThreshold",
                table: "ShippingRates");
        }
    }
}
