using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class CampaignsController(StoreContext context) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<Campaign>>> GetCampaigns()
    {
        var items = await context.Campaigns
            .Where(c => c.IsActive)
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Campaign>> GetCampaign(int id)
    {
        var item = await context.Campaigns.FindAsync(id);
        if (item == null) return NotFound();
        return item;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Campaign>> CreateCampaign(Campaign c)
    {
        if (string.IsNullOrWhiteSpace(c.Slug) && !string.IsNullOrWhiteSpace(c.Name))
        {
            c.Slug = c.Name.ToLower().Replace(' ', '-');
        }

        context.Campaigns.Add(c);
        var res = await context.SaveChangesAsync() > 0;
        if (!res) return BadRequest("Problem creating campaign");
        return CreatedAtAction(nameof(GetCampaign), new { id = c.Id }, c);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult> UpdateCampaign(Campaign c)
    {
        var existing = await context.Campaigns.FindAsync(c.Id);
        if (existing == null) return NotFound();

        existing.Name = c.Name;
        existing.Slug = c.Slug;
        existing.IsActive = c.IsActive;
        existing.Description = c.Description;
        existing.ImageUrl = c.ImageUrl;
        existing.StartDate = c.StartDate;
        existing.EndDate = c.EndDate;

        var res = await context.SaveChangesAsync() > 0;
        if (!res) return BadRequest("Problem updating campaign");
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteCampaign(int id)
    {
        var existing = await context.Campaigns.FindAsync(id);
        if (existing == null) return NotFound();

        context.Campaigns.Remove(existing);
        var res = await context.SaveChangesAsync() > 0;
        if (!res) return BadRequest("Problem deleting campaign");
        return Ok();
    }
}
