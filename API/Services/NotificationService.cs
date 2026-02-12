using System;
using System.Threading;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace API.Services;

public class NotificationService(StoreContext context, UserManager<User> userManager, ILogger<NotificationService> logger) : INotificationService
{
    public async Task TryCreateForEmailAsync(string email, string title, string message, string? url = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email)) return;

        try
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null) return;

            await TryCreateForUserIdAsync(user.Id, title, message, url, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[Notifications] Failed to create notification for email {Email}", email);
        }
    }

    public async Task TryCreateForUserIdAsync(string userId, string title, string message, string? url = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId)) return;
        if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(message)) return;

        try
        {
            context.UserNotifications.Add(new UserNotification
            {
                UserId = userId,
                Title = title?.Trim() ?? string.Empty,
                Message = message?.Trim() ?? string.Empty,
                Url = string.IsNullOrWhiteSpace(url) ? null : url.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });

            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[Notifications] Failed to create notification for userId {UserId}", userId);
        }
    }
}
