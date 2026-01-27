using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DbAdminController(StoreContext context) : BaseApiController
{
    [HttpGet("db/migrations")]
    public async Task<ActionResult> GetMigrations()
    {
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "db_unavailable", canConnect });
        }

        var applied = await context.Database.GetAppliedMigrationsAsync();
        var pending = await context.Database.GetPendingMigrationsAsync();

        return Ok(new
        {
            status = "db_ok",
            canConnect,
            appliedMigrations = applied.ToArray(),
            pendingMigrations = pending.ToArray()
        });
    }

    [HttpPost("db/migrate")]
    public async Task<ActionResult> Migrate()
    {
        try
        {
            var canConnect = await context.Database.CanConnectAsync();
            if (!canConnect)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "db_unavailable", canConnect });
            }

            var pendingBefore = (await context.Database.GetPendingMigrationsAsync()).ToArray();

            await context.Database.MigrateAsync();

            var pendingAfter = (await context.Database.GetPendingMigrationsAsync()).ToArray();
            return Ok(new
            {
                status = "migrated",
                pendingBefore,
                pendingAfter
            });
        }
        catch (Exception ex)
        {
            return Problem(
                title: "Database migration failed",
                detail: ex.Message,
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}
