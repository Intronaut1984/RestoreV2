using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminReplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AdminRepliedAt",
                table: "ProductReviews",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdminReply",
                table: "ProductReviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AdminCommentRepliedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdminCommentReply",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AdminRepliedAt",
                table: "OrderIncidents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdminReply",
                table: "OrderIncidents",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdminRepliedAt",
                table: "ProductReviews");

            migrationBuilder.DropColumn(
                name: "AdminReply",
                table: "ProductReviews");

            migrationBuilder.DropColumn(
                name: "AdminCommentRepliedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdminCommentReply",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdminRepliedAt",
                table: "OrderIncidents");

            migrationBuilder.DropColumn(
                name: "AdminReply",
                table: "OrderIncidents");
        }
    }
}
