using API.Data;
using API.DTOs;
using API.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShippingRateController(StoreContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ShippingRateDto>> GetShippingRate()
    {
        var shippingRate = await context.ShippingRates.FirstOrDefaultAsync();
        if (shippingRate == null)
            return Ok(new ShippingRateDto { Rate = 0 });
        
        return Ok(mapper.Map<ShippingRateDto>(shippingRate));
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateShippingRate([FromBody] ShippingRateDto dto)
    {
        var shippingRate = await context.ShippingRates.FirstOrDefaultAsync();
        
        if (shippingRate == null)
        {
            shippingRate = new ShippingRate();
            context.ShippingRates.Add(shippingRate);
            await context.SaveChangesAsync();
            // Reload to get the generated Id
            shippingRate = await context.ShippingRates.FirstOrDefaultAsync();
            if (shippingRate == null)
                return BadRequest("Failed to create shipping rate");
        }

        // Manually map properties to avoid mapping the Id (primary key)
        shippingRate.Rate = dto.Rate;
        shippingRate.UpdatedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync();
        return Ok();
    }
}
