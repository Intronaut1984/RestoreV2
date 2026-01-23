using System.Linq;
using API.DTOs;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LogoController(API.Data.StoreContext context, ImageService imageService) : ControllerBase
{
    [HttpGet]
    public ActionResult<LogoDto> GetLogo()
    {
        var logo = context.Logos.FirstOrDefault();
        if (logo == null)
        {
            return Ok(new LogoDto { Url = "/images/logo.png" });
        }
        return Ok(new LogoDto { Url = logo.Url });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult> UpdateLogo([FromForm] LogoDto dto)
    {
        if (dto == null) return BadRequest("Invalid payload");

        var logo = context.Logos.FirstOrDefault();
        if (logo == null)
        {
            logo = new API.Entities.Logo { Url = "/images/logo.png", PublicId = null };
            context.Logos.Add(logo);
            await context.SaveChangesAsync();
            // Re-fetch after insert to ensure we have the permanent ID
            logo = context.Logos.FirstOrDefault();
            if (logo == null)
                return BadRequest("Failed to create logo");
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
