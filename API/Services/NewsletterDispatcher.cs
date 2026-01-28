using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API.Services;

public class NewsletterDispatcher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NewsletterDispatcher> _logger;

    public NewsletterDispatcher(IServiceScopeFactory scopeFactory, ILogger<NewsletterDispatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Small delay to avoid racing app startup/DB init
        await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDueNewsletters(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Newsletter] Dispatcher loop error");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task ProcessDueNewsletters(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<StoreContext>();
        var sender = scope.ServiceProvider.GetRequiredService<INewsletterSender>();

        var now = DateTime.UtcNow;

        var due = await context.Newsletters
            .Include(n => n.Attachments)
            .Where(n => n.Status == NewsletterStatus.Scheduled && n.ScheduledForUtc != null && n.ScheduledForUtc <= now)
            .OrderBy(n => n.ScheduledForUtc)
            .Take(5)
            .ToListAsync(ct);

        foreach (var n in due)
        {
            ct.ThrowIfCancellationRequested();

            try
            {
                // Mark as sending
                n.Status = NewsletterStatus.Sending;
                n.UpdatedAtUtc = DateTime.UtcNow;
                n.LastError = null;
                await context.SaveChangesAsync(ct);

                var recipients = await context.Users
                    .AsNoTracking()
                    .Where(u => u.NewsletterOptIn && u.Email != null && u.Email != "")
                    .Select(u => u.Email!)
                    .ToListAsync(ct);

                n.TotalRecipients = recipients.Count;
                n.SentCount = 0;
                n.FailedCount = 0;
                n.LastError = null;
                await context.SaveChangesAsync(ct);

                if (n.TotalRecipients == 0)
                {
                    n.Status = NewsletterStatus.Failed;
                    n.LastError = "No opted-in recipients";
                    n.SentAtUtc = DateTime.UtcNow;
                    n.UpdatedAtUtc = DateTime.UtcNow;
                    await context.SaveChangesAsync(ct);
                    continue;
                }

                foreach (var email in recipients)
                {
                    ct.ThrowIfCancellationRequested();

                    var result = await sender.SendNewsletterAsync(email, n.Subject, n.HtmlContent, n.Attachments, ct);
                    if (result.Ok)
                    {
                        n.SentCount++;
                    }
                    else
                    {
                        n.FailedCount++;
                        // keep first error message for diagnostics
                        n.LastError ??= result.Error;
                    }

                    // Very small throttle to reduce rate-limit risk
                    await Task.Delay(100, ct);
                }

                n.Status = n.FailedCount == 0 ? NewsletterStatus.Sent : NewsletterStatus.Failed;
                n.SentAtUtc = DateTime.UtcNow;
                n.UpdatedAtUtc = DateTime.UtcNow;
                await context.SaveChangesAsync(ct);

                _logger.LogInformation("[Newsletter] Sent newsletter {Id} to {Total} (ok={Ok}, failed={Failed})",
                    n.Id, n.TotalRecipients, n.SentCount, n.FailedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Newsletter] Failed sending newsletter {Id}", n.Id);
                n.Status = NewsletterStatus.Failed;
                n.LastError = ex.Message;
                n.UpdatedAtUtc = DateTime.UtcNow;
                await context.SaveChangesAsync(ct);
            }
        }
    }
}
