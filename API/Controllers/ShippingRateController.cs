using API.Data;
using API.DTOs;
using API.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShippingRateController(StoreContext context, IMapper mapper, ILogger<ShippingRateController> logger) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ShippingRateDto>> GetShippingRate()
    {
        try
        {
            var shippingRate = await context.ShippingRates.FirstOrDefaultAsync();
            if (shippingRate == null)
                return Ok(new ShippingRateDto { Rate = 0 });

            return Ok(mapper.Map<ShippingRateDto>(shippingRate));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load ShippingRate from database");
            return Ok(new ShippingRateDto { Rate = 0 });
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
                    UpdatedAt = DateTime.UtcNow
                };
                context.ShippingRates.Add(shippingRate);
            }
            else
            {
                shippingRate.Rate = dto.Rate;
                shippingRate.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
            return Ok();
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex, "Failed to update ShippingRate (DbUpdateException)");
            return Problem(
                title: "Database error while updating shipping rate",
                detail: "The database may be unavailable or not migrated yet.",
                statusCode: StatusCodes.Status500InternalServerError);
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
