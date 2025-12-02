using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class CategoriesController(StoreContext context) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<Category>>> GetCategories()
    {
        var items = await context.Categories
            .Where(c => c.IsActive)
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Category>> GetCategory(int id)
    {
        var item = await context.Categories.FindAsync(id);
        if (item == null) return NotFound();
        return item;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory(Category c)
    {
        if (string.IsNullOrWhiteSpace(c.Slug) && !string.IsNullOrWhiteSpace(c.Name))
        {
            c.Slug = c.Name.ToLower().Replace(' ', '-');
        }

        context.Categories.Add(c);
        var res = await context.SaveChangesAsync() > 0;
        if (!res) return BadRequest("Problem creating category");
        return CreatedAtAction(nameof(GetCategory), new { id = c.Id }, c);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult> UpdateCategory(Category c)
    {
        var existing = await context.Categories.FindAsync(c.Id);
        if (existing == null) return NotFound();

        existing.Name = c.Name;
        existing.Slug = c.Slug;
        existing.IsActive = c.IsActive;
        existing.Description = c.Description;

        var res = await context.SaveChangesAsync() > 0;
        if (!res) return BadRequest("Problem updating category");
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteCategory(int id)
    {
        var existing = await context.Categories.FindAsync(id);
        if (existing == null) return NotFound();

        context.Categories.Remove(existing);
        var res = await context.SaveChangesAsync() > 0;
        if (!res) return BadRequest("Problem deleting category");
        return Ok();
    }
}
