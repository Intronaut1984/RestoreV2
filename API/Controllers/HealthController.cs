using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[AllowAnonymous]
public class HealthController(StoreContext context) : BaseApiController
{
    [HttpGet("health")]
    public ActionResult GetHealth()
    {
        return Ok(new { status = "ok" });
    }

    [HttpGet("health/db")]
    public async Task<ActionResult> GetDbHealth()
    {
        try
        {
            var canConnect = await context.Database.CanConnectAsync();
            if (!canConnect)
            {
                return StatusCode(503, new { status = "db_unavailable", canConnect });
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
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "db_error",
                error = ex.Message
            });
        }
    }
}
