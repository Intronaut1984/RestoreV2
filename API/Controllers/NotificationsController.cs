using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize]
public class NotificationsController(StoreContext context) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<UserNotificationDto[]>> GetNotifications([FromQuery] int take = 20, CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        take = Math.Clamp(take, 1, 100);

        var items = await context.UserNotifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new UserNotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Url = n.Url,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead
            })
            .ToArrayAsync(ct);

        return items;
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var count = await context.UserNotifications
            .AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync(ct);

        return count;
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var n = await context.UserNotifications
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);

        if (n == null) return NotFound();
        if (n.IsRead) return NoContent();

        n.IsRead = true;
        n.ReadAt = DateTime.UtcNow;
        await context.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var toUpdate = await context.UserNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        if (toUpdate.Count == 0) return NoContent();

        var now = DateTime.UtcNow;
        foreach (var n in toUpdate)
        {
            n.IsRead = true;
            n.ReadAt = now;
        }

        await context.SaveChangesAsync(ct);
        return NoContent();
    }
}
