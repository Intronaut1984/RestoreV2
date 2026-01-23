using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FavoritesController(StoreContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetFavorites()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        #pragma warning disable CS8602 // possible null reference - we filter Product != null below
        var products = await context.Favorites
            .Where(f => f.UserId == userId && f.Product != null)
            .Include(f => f.Product!) 
                .ThenInclude(p => p.Campaigns)
            .Include(f => f.Product!)
                .ThenInclude(p => p.Categories)
            .Select(f => f.Product!)
            .ToListAsync();
        #pragma warning restore CS8602

        // mark as favorite
        foreach (var p in products)
        {
            p.IsFavorite = true;
        }

        return Ok(products);
    }

    [HttpPost("{productId:int}")]
    public async Task<ActionResult> AddFavorite(int productId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var product = await context.Products.FindAsync(productId);
        if (product == null) return NotFound();

        var exists = await context.Favorites.AnyAsync(f => f.UserId == userId && f.ProductId == productId);
        if (exists) return BadRequest(new { message = "Product already in favorites" });

        var fav = new Favorite { UserId = userId, ProductId = productId };
        context.Favorites.Add(fav);
        var result = await context.SaveChangesAsync() > 0;
        if (result) return Ok();
        return BadRequest(new { message = "Problem adding favorite" });
    }

    [HttpDelete("{productId:int}")]
    public async Task<ActionResult> RemoveFavorite(int productId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var fav = await context.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId);
        if (fav == null) return NotFound();

        context.Favorites.Remove(fav);
        var result = await context.SaveChangesAsync() > 0;
        if (result) return Ok();
        return BadRequest(new { message = "Problem removing favorite" });
    }
}
