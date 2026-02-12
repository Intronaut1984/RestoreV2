using System.Linq;
using System.Globalization;
using API.DTOs;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LogoController(API.Data.StoreContext context, ImageService imageService, ILogger<LogoController> logger) : ControllerBase
{
    [HttpGet]
    public ActionResult<LogoDto> GetLogo()
    {
        try
        {
            var logo = context.Logos.FirstOrDefault();
            if (logo == null)
            {
                return Ok(new LogoDto { Url = "/images/logo.png", Scale = 1.0m });
            }

            return Ok(new LogoDto { Url = logo.Url, Scale = logo.Scale });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load Logo from database");
            return Ok(new LogoDto { Url = "/images/logo.png", Scale = 1.0m });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult> UpdateLogo([FromForm] LogoUpdateDto dto)
    {
        if (dto == null) return BadRequest("Invalid payload");

        var logo = context.Logos.FirstOrDefault();
        if (logo == null)
        {
            logo = new API.Entities.Logo { Url = "/images/logo.png", PublicId = null, Scale = 1.0m };
            context.Logos.Add(logo);
            await context.SaveChangesAsync();
            // Re-fetch after insert to ensure we have the permanent ID
            logo = context.Logos.FirstOrDefault();
            if (logo == null)
                return BadRequest("Failed to create logo");
        }

        decimal? scale = null;
        if (!string.IsNullOrWhiteSpace(dto.Scale))
        {
            var s = dto.Scale.Trim();
            // Multipart/form-data decimal parsing can be culture-sensitive.
            // Accept both "1.25" and "1,25" reliably.
            if (decimal.TryParse(s, NumberStyles.Number, CultureInfo.InvariantCulture, out var inv))
                scale = inv;
            else if (decimal.TryParse(s, NumberStyles.Number, CultureInfo.CurrentCulture, out var cur))
                scale = cur;
            else if (decimal.TryParse(s.Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out var normalized))
                scale = normalized;
        }

        if (scale.HasValue)
        {
            var clamped = Math.Clamp(scale.Value, 0.50m, 3.00m);
            logo.Scale = clamped;
        }

        // Handle file upload if provided
        if (dto.File != null)
        {
            var imageResult = await imageService.AddImageAsync(dto.File);

            if (imageResult.Error != null)
                return BadRequest(imageResult.Error.Message);

            // Delete old logo from Cloudinary if it exists and has a public ID stored
            if (!string.IsNullOrEmpty(logo.PublicId))
            {
                try
                {
                    await imageService.DeleteImageAsync(logo.PublicId);
                }
                catch
                {
                    // Log but continue if deletion fails
                }
            }

            logo.Url = imageResult.SecureUrl.AbsoluteUri;
            logo.PublicId = imageResult.PublicId;
        }
        // Handle URL update if no file provided
        else if (!string.IsNullOrEmpty(dto.Url))
        {
            logo.Url = dto.Url;
            logo.PublicId = null; // Clear public ID if URL is provided
        }

        // Since the entity is already tracked, just save changes
        await context.SaveChangesAsync();
        return NoContent();
    }
}
