using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicIdToLogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // This migration became redundant because the previous migration that created
            // the Logos table already included the PublicId column.
            // Make it idempotent so it can run safely against existing databases.
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'[dbo].[Logos]', N'PublicId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Logos] ADD [PublicId] nvarchar(max) NULL;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'[dbo].[Logos]', N'PublicId') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Logos] DROP COLUMN [PublicId];
END
");
        }
    }
}
