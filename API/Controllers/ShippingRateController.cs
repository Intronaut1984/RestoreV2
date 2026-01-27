using API.Data;
using API.DTOs;
using API.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShippingRateController(StoreContext context, IMapper mapper, ILogger<ShippingRateController> logger) : ControllerBase
{
    private const decimal DefaultRate = 5m;
    private const decimal DefaultFreeShippingThreshold = 100m;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ShippingRateDto>> GetShippingRate()
    {
        try
        {
            var shippingRate = await context.ShippingRates.FirstOrDefaultAsync();
            if (shippingRate == null)
                return Ok(new ShippingRateDto { Rate = DefaultRate, FreeShippingThreshold = DefaultFreeShippingThreshold, UpdatedAt = DateTime.UtcNow });

            return Ok(mapper.Map<ShippingRateDto>(shippingRate));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load ShippingRate from database");
            return Ok(new ShippingRateDto { Rate = DefaultRate, FreeShippingThreshold = DefaultFreeShippingThreshold, UpdatedAt = DateTime.UtcNow });
        }
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateShippingRate([FromBody] ShippingRateDto dto)
    {
        try
        {
            var shippingRate = await context.ShippingRates.FirstOrDefaultAsync();

            if (shippingRate == null)
            {
                shippingRate = new ShippingRate
                {
                    Rate = dto.Rate,
                    FreeShippingThreshold = dto.FreeShippingThreshold,
                    UpdatedAt = DateTime.UtcNow
                };
                context.ShippingRates.Add(shippingRate);
            }
            else
            {
                shippingRate.Rate = dto.Rate;
                shippingRate.FreeShippingThreshold = dto.FreeShippingThreshold;
                shippingRate.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
            return Ok();
        }
        catch (SqlException ex)
        {
            logger.LogError(ex, "Failed to update ShippingRate (SqlException)");

            var detail = ex.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
                ? "Database schema is missing required tables (e.g. ShippingRates). Apply EF Core migrations to the production database."
                : "Database error while updating shipping rate.";

            return Problem(
                title: "Database error while updating shipping rate",
                detail: detail,
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex, "Failed to update ShippingRate (DbUpdateException)");
            return Problem(
                title: "Database error while updating shipping rate",
                detail: "The database may be unavailable or not migrated yet.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update ShippingRate");
            return Problem(
                title: "Error while updating shipping rate",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }
}
