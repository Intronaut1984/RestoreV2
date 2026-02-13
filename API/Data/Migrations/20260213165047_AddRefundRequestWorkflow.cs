using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundRequestWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RefundRequestReason",
                table: "Orders",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RefundRequestStatus",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundRequestedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundReviewNote",
                table: "Orders",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundReviewedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RestockedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SalesCountAdjustedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_RefundRequestStatus",
                table: "Orders",
                column: "RefundRequestStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_RefundRequestStatus",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RefundRequestReason",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RefundRequestStatus",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RefundRequestedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RefundReviewNote",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RefundReviewedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RestockedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SalesCountAdjustedAt",
                table: "Orders");
        }
    }
}
