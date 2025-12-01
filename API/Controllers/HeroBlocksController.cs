using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HeroBlocksController : ControllerBase
{
    private readonly StoreContext _context;
    private readonly ImageService _imageService;

    public HeroBlocksController(StoreContext context, ImageService imageService)
    {
        _context = context;
        _imageService = imageService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var blocks = await _context.HeroBlocks
            .Include(b => b.Images)
            .OrderBy(b => b.Order)
            .ToListAsync();

        return Ok(blocks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var block = await _context.HeroBlocks
            .Include(b => b.Images)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (block == null) return NotFound();

        return Ok(block);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HeroBlock model)
    {
        _context.HeroBlocks.Add(model);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] HeroBlock model)
    {
        var block = await _context.HeroBlocks.FindAsync(id);
        if (block == null) return NotFound();

        block.Title = model.Title;
        block.Visible = model.Visible;
        block.Order = model.Order;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var block = await _context.HeroBlocks
            .Include(b => b.Images)
            .FirstOrDefaultAsync(b => b.Id == id);
        if (block == null) return NotFound();

        // delete images from cloudinary if public id present
        if (block.Images != null)
        {
            foreach (var img in block.Images)
            {
                if (!string.IsNullOrEmpty(img.PublicId))
                {
                    await _imageService.DeleteImageAsync(img.PublicId);
                }
                _context.HeroBlockImages.Remove(img);
            }
        }

        _context.HeroBlocks.Remove(block);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/images")]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        var block = await _context.HeroBlocks.FindAsync(id);
        if (block == null) return NotFound();

        var result = await _imageService.AddImageAsync(file);
        if (result == null || result.SecureUrl == null)
            return BadRequest("Image upload failed");

        var img = new HeroBlockImage
        {
            HeroBlockId = id,
            Url = result.SecureUrl.ToString(),
            PublicId = result.PublicId,
            Order = 0
        };

        _context.HeroBlockImages.Add(img);
        await _context.SaveChangesAsync();

        return Ok(img);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{blockId}/images/{imageId}")]
    public async Task<IActionResult> DeleteImage(int blockId, int imageId)
    {
        var img = await _context.HeroBlockImages.FindAsync(imageId);
        if (img == null || img.HeroBlockId != blockId) return NotFound();

        if (!string.IsNullOrEmpty(img.PublicId))
        {
            await _imageService.DeleteImageAsync(img.PublicId);
        }

        _context.HeroBlockImages.Remove(img);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
