using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddThemePaletteColorsToUiSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PrimaryColorDark",
                table: "UiSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColorLight",
                table: "UiSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SecondaryColorDark",
                table: "UiSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SecondaryColorLight",
                table: "UiSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PrimaryColorDark",
                table: "UiSettings");

            migrationBuilder.DropColumn(
                name: "PrimaryColorLight",
                table: "UiSettings");

            migrationBuilder.DropColumn(
                name: "SecondaryColorDark",
                table: "UiSettings");

            migrationBuilder.DropColumn(
                name: "SecondaryColorLight",
                table: "UiSettings");
        }
    }
}
