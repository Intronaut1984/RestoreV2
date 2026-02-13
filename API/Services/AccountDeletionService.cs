using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace API.Services;

public class AccountDeletionService(
    StoreContext context,
    UserManager<User> userManager,
    IWebHostEnvironment env,
    ILogger<AccountDeletionService> logger)
{
    public async Task<(bool ok, string? error)> DeleteUserAsync(User user, bool deleteStoredData, CancellationToken ct = default)
    {
        if (user == null) return (false, "User is null");

        var userId = user.Id;
        var email = (user.Email ?? string.Empty).Trim();
        var addressId = user.AddressId;

        // Always remove per-user data tied to Identity user id
        try
        {
            await DeleteNotificationsAsync(userId, ct);
            await NullOutProductClicksUserIdAsync(userId, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed deleting per-user data for userId {UserId}", userId);
            return (false, "Problem deleting user data");
        }

        if (deleteStoredData && !string.IsNullOrWhiteSpace(email))
        {
            var deletedEmail = BuildDeletedEmail(userId);

            try
            {
                await SoftDeleteProductReviewsByEmailAsync(email, deletedEmail, ct);
                await AnonymizeOrdersByEmailAsync(email, deletedEmail, ct);
                await DeleteIncidentsByEmailAsync(email, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed deleting stored data for email {Email}", email);
                return (false, "Problem deleting stored data");
            }
        }

        // Delete identity record (will cascade to favorites/claims/roles, etc)
        var deleteResult = await userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
        {
            var msg = deleteResult.Errors.FirstOrDefault()?.Description ?? "Problem deleting user";
            return (false, msg);
        }

        // Best-effort cleanup: remove address row (it's personal and only referenced by user)
        if (addressId.HasValue)
        {
            try
            {
                var address = await context.Set<Address>().FirstOrDefaultAsync(a => a.Id == addressId.Value, ct);
                if (address != null)
                {
                    context.Remove(address);
                    await context.SaveChangesAsync(ct);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to delete address {AddressId} after deleting user {UserId}", addressId.Value, userId);
            }
        }

        return (true, null);
    }

    private static string BuildDeletedEmail(string userId)
    {
        // RFC 2606 reserves example.invalid for invalid domains.
        return $"deleted-{userId}@example.invalid";
    }

    private async Task DeleteNotificationsAsync(string userId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId)) return;

        var toRemove = await context.UserNotifications
            .Where(n => n.UserId == userId)
            .ToListAsync(ct);

        if (toRemove.Count == 0) return;

        context.UserNotifications.RemoveRange(toRemove);
        await context.SaveChangesAsync(ct);
    }

    private async Task NullOutProductClicksUserIdAsync(string userId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId)) return;

        var clicks = await context.ProductClicks
            .Where(c => c.UserId == userId)
            .ToListAsync(ct);

        if (clicks.Count == 0) return;

        foreach (var c in clicks)
        {
            c.UserId = null;
        }

        await context.SaveChangesAsync(ct);
    }

    private async Task SoftDeleteProductReviewsByEmailAsync(string email, string deletedEmail, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var reviews = await context.ProductReviews
            .IgnoreQueryFilters()
            .Where(r => r.BuyerEmail == email && !r.IsDeleted)
            .ToListAsync(ct);

        if (reviews.Count == 0) return;

        foreach (var r in reviews)
        {
            r.IsDeleted = true;
            r.DeletedAt = now;
            r.DeletedByEmail = deletedEmail;
            r.DeletedReason = "Conta apagada";
        }

        await context.SaveChangesAsync(ct);
    }

    private async Task AnonymizeOrdersByEmailAsync(string email, string deletedEmail, CancellationToken ct)
    {
        var orders = await context.Orders
            .Where(o => o.BuyerEmail == email)
            .ToListAsync(ct);

        if (orders.Count == 0) return;

        foreach (var o in orders)
        {
            o.BuyerEmail = deletedEmail;

            o.ShippingAddress.Name = "Apagado";
            o.ShippingAddress.Line1 = "Apagado";
            o.ShippingAddress.Line2 = null;
            o.ShippingAddress.City = "Apagado";
            o.ShippingAddress.State = "Apagado";
            o.ShippingAddress.PostalCode = "Apagado";
            o.ShippingAddress.Country = "Apagado";

            o.CustomerComment = null;
            o.CustomerCommentedAt = null;
            o.AdminCommentReply = null;
            o.AdminCommentRepliedAt = null;
        }

        await context.SaveChangesAsync(ct);
    }

    private async Task DeleteIncidentsByEmailAsync(string email, CancellationToken ct)
    {
        var incidents = await context.OrderIncidents
            .Include(i => i.Attachments)
            .Where(i => i.BuyerEmail == email)
            .ToListAsync(ct);

        if (incidents.Count == 0) return;

        foreach (var incident in incidents)
        {
            foreach (var a in incident.Attachments)
            {
                try
                {
                    var abs = Path.Combine(env.ContentRootPath, a.RelativePath.Replace('/', Path.DirectorySeparatorChar));
                    if (File.Exists(abs)) File.Delete(abs);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to delete incident attachment file {RelativePath}", a.RelativePath);
                }
            }

            context.OrderIncidents.Remove(incident);
        }

        await context.SaveChangesAsync(ct);
    }
}
