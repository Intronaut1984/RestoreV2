using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Entities;
using API.RequestHelpers;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
public class NewslettersController(StoreContext context, IHostEnvironment env, IOptions<EmailSettings> emailOptions, UserManager<User> userManager) : BaseApiController
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml"
    };

    [HttpGet]
    public async Task<ActionResult<List<NewsletterDto>>> GetAll()
    {
        var res = await context.Newsletters
            .AsNoTracking()
            .Include(n => n.Attachments)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(200)
            .Select(n => new NewsletterDto
            {
                Id = n.Id,
                Subject = n.Subject,
                HtmlContent = n.HtmlContent,
                Status = n.Status,
                ScheduledForUtc = n.ScheduledForUtc,
                CreatedAtUtc = n.CreatedAtUtc,
                UpdatedAtUtc = n.UpdatedAtUtc,
                SentAtUtc = n.SentAtUtc,
                TotalRecipients = n.TotalRecipients,
                SentCount = n.SentCount,
                FailedCount = n.FailedCount,
                LastError = n.LastError,
                Attachments = n.Attachments
                    .OrderBy(a => a.Id)
                    .Select(a => new NewsletterAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        ContentType = a.ContentType,
                        SizeBytes = a.SizeBytes,
                        UploadedAtUtc = a.UploadedAtUtc
                    })
                    .ToList()
            })
            .ToListAsync();

        return res;
    }

    [HttpGet("config")]
    public ActionResult GetEmailConfig()
    {
        var s = emailOptions.Value;
        return Ok(new
        {
            sendGridApiKeyConfigured = !string.IsNullOrWhiteSpace(s.SendGridApiKey),
            fromEmailConfigured = !string.IsNullOrWhiteSpace(s.FromEmail),
            fromEmail = s.FromEmail,
            fromName = s.FromName,
            useSandbox = s.UseSandbox
        });
    }

    [HttpGet("recipients")]
    public async Task<ActionResult<List<NewsletterRecipientDto>>> GetRecipients()
    {
        var recipients = await context.Users
            .AsNoTracking()
            .Where(u => u.NewsletterOptIn && u.Email != null && u.Email != "")
            .OrderBy(u => u.Email)
            .Select(u => new NewsletterRecipientDto
            {
                Id = u.Id,
                Email = u.Email!,
                UserName = u.UserName,
                EmailConfirmed = u.EmailConfirmed,
                NewsletterOptIn = u.NewsletterOptIn
            })
            .ToListAsync();

        return recipients;
    }

    [AllowAnonymous]
    [HttpGet("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromQuery] string userId, [FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(token))
            return BadRequest("Missing userId/token");

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return Content("<html><body><h2>Pedido inválido</h2><p>Utilizador não encontrado.</p></body></html>", "text/html");

        var decodedToken = WebUtility.UrlDecode(token);
        var valid = await userManager.VerifyUserTokenAsync(
            user,
            TokenOptions.DefaultProvider,
            NewsletterTokens.UnsubscribePurpose,
            decodedToken);

        if (!valid)
            return Content("<html><body><h2>Link inválido</h2><p>O link para cancelar a subscrição é inválido ou expirou.</p></body></html>", "text/html");

        if (!user.NewsletterOptIn)
            return Content("<html><body><h2>Já está cancelado</h2><p>A sua subscrição já estava desativada.</p></body></html>", "text/html");

        user.NewsletterOptIn = false;
        var update = await userManager.UpdateAsync(user);
        if (!update.Succeeded)
            return Content("<html><body><h2>Erro</h2><p>Não foi possível cancelar a subscrição. Tente novamente mais tarde.</p></body></html>", "text/html");

        var home = (emailOptions.Value.FrontendUrl ?? string.Empty).TrimEnd('/');
        var homeLink = string.IsNullOrWhiteSpace(home) ? "/" : home;
        return Content($"<html><body><h2>Subscrição cancelada</h2><p>Deixará de receber newsletters.</p><p><a href=\"{homeLink}\">Voltar ao site</a></p></body></html>", "text/html");
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NewsletterDto>> GetById(int id)
    {
        var n = await context.Newsletters
            .AsNoTracking()
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (n == null) return NotFound();

        return new NewsletterDto
        {
            Id = n.Id,
            Subject = n.Subject,
            HtmlContent = n.HtmlContent,
            Status = n.Status,
            ScheduledForUtc = n.ScheduledForUtc,
            CreatedAtUtc = n.CreatedAtUtc,
            UpdatedAtUtc = n.UpdatedAtUtc,
            SentAtUtc = n.SentAtUtc,
            TotalRecipients = n.TotalRecipients,
            SentCount = n.SentCount,
            FailedCount = n.FailedCount,
            LastError = n.LastError,
            Attachments = n.Attachments
                .OrderBy(a => a.Id)
                .Select(a => new NewsletterAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    ContentType = a.ContentType,
                    SizeBytes = a.SizeBytes,
                    UploadedAtUtc = a.UploadedAtUtc
                })
                .ToList()
        };
    }

    [HttpPost]
    public async Task<ActionResult<NewsletterDto>> Create(CreateNewsletterDto dto)
    {
        var n = new Newsletter
        {
            Subject = dto.Subject?.Trim() ?? string.Empty,
            HtmlContent = dto.HtmlContent ?? string.Empty,
            Status = dto.ScheduledForUtc.HasValue ? NewsletterStatus.Scheduled : NewsletterStatus.Draft,
            ScheduledForUtc = dto.ScheduledForUtc?.ToUniversalTime(),
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };

        context.Newsletters.Add(n);
        await context.SaveChangesAsync();

        return await GetById(n.Id);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<NewsletterDto>> Update(int id, UpdateNewsletterDto dto)
    {
        var n = await context.Newsletters
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (n == null) return NotFound();
        if (n.Status is NewsletterStatus.Sent or NewsletterStatus.Sending) return BadRequest("Newsletter already sent/sending");

        if (dto.Subject != null) n.Subject = dto.Subject.Trim();
        if (dto.HtmlContent != null) n.HtmlContent = dto.HtmlContent;
        n.ScheduledForUtc = dto.ScheduledForUtc?.ToUniversalTime();

        if (dto.Status.HasValue)
        {
            if (dto.Status == NewsletterStatus.Cancelled)
            {
                n.Status = NewsletterStatus.Cancelled;
            }
            else if (dto.Status == NewsletterStatus.Draft)
            {
                n.Status = NewsletterStatus.Draft;
            }
            else if (dto.Status == NewsletterStatus.Scheduled)
            {
                if (n.ScheduledForUtc == null) return BadRequest("ScheduledForUtc is required when scheduling");
                n.Status = NewsletterStatus.Scheduled;
            }
        }
        else
        {
            // If scheduled date exists, keep scheduled status
            if (n.ScheduledForUtc != null && n.Status == NewsletterStatus.Draft)
                n.Status = NewsletterStatus.Scheduled;
        }

        n.UpdatedAtUtc = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return await GetById(n.Id);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var n = await context.Newsletters
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (n == null) return NotFound();
        if (n.Status == NewsletterStatus.Sending) return BadRequest("Newsletter is currently sending");

        var attachmentPaths = n.Attachments
            .Select(a => a.StoragePath)
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Cast<string>()
            .ToList();

        context.Newsletters.Remove(n);
        await context.SaveChangesAsync();

        foreach (var path in attachmentPaths)
        {
            try
            {
                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);
            }
            catch
            {
                // ignore
            }
        }

        try
        {
            var dir = Path.Combine(env.ContentRootPath, "Uploads", "newsletters", id.ToString());
            if (Directory.Exists(dir) && !Directory.EnumerateFileSystemEntries(dir).Any())
                Directory.Delete(dir);
        }
        catch
        {
            // ignore
        }

        return NoContent();
    }

    [HttpPost("{id:int}/attachments")]
    [RequestSizeLimit(25_000_000)]
    public async Task<ActionResult<List<NewsletterAttachmentDto>>> UploadAttachments(int id, [FromForm] List<IFormFile> files)
    {
        var n = await context.Newsletters
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (n == null) return NotFound();
        if (n.Status is NewsletterStatus.Sent or NewsletterStatus.Sending) return BadRequest("Newsletter already sent/sending");
        if (files == null || files.Count == 0) return BadRequest("No files");

        var baseDir = Path.Combine(env.ContentRootPath, "Uploads", "newsletters", id.ToString());
        Directory.CreateDirectory(baseDir);

        foreach (var f in files)
        {
            if (f.Length <= 0) continue;
            if (f.Length > 10 * 1024 * 1024) return BadRequest("Max attachment size is 10MB");

            var contentType = f.ContentType ?? string.Empty;
            if (!AllowedContentTypes.Contains(contentType))
                return BadRequest($"Unsupported content type: {contentType}");

            var safeName = Path.GetFileName(f.FileName);
            var unique = $"{Guid.NewGuid():N}-{safeName}";
            var path = Path.Combine(baseDir, unique);

            await using (var stream = System.IO.File.Create(path))
            {
                await f.CopyToAsync(stream);
            }

            n.Attachments.Add(new NewsletterAttachment
            {
                FileName = safeName,
                ContentType = contentType,
                SizeBytes = f.Length,
                StoragePath = path,
                UploadedAtUtc = DateTime.UtcNow
            });
        }

        n.UpdatedAtUtc = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return n.Attachments
            .OrderBy(a => a.Id)
            .Select(a => new NewsletterAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                SizeBytes = a.SizeBytes,
                UploadedAtUtc = a.UploadedAtUtc
            })
            .ToList();
    }

    [HttpGet("{id:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DownloadAttachment(int id, int attachmentId)
    {
        var att = await context.NewsletterAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.NewsletterId == id);

        if (att == null) return NotFound();
        if (string.IsNullOrWhiteSpace(att.StoragePath) || !System.IO.File.Exists(att.StoragePath)) return NotFound();

        var bytes = await System.IO.File.ReadAllBytesAsync(att.StoragePath);
        return File(bytes, att.ContentType, att.FileName);
    }

    [HttpDelete("{id:int}/attachments/{attachmentId:int}")]
    public async Task<ActionResult> DeleteAttachment(int id, int attachmentId)
    {
        var att = await context.NewsletterAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.NewsletterId == id);

        if (att == null) return NotFound();

        var newsletter = await context.Newsletters.FirstOrDefaultAsync(n => n.Id == id);
        if (newsletter == null) return NotFound();
        if (newsletter.Status is NewsletterStatus.Sent or NewsletterStatus.Sending) return BadRequest("Newsletter already sent/sending");

        context.NewsletterAttachments.Remove(att);
        await context.SaveChangesAsync();

        try
        {
            if (!string.IsNullOrWhiteSpace(att.StoragePath) && System.IO.File.Exists(att.StoragePath))
                System.IO.File.Delete(att.StoragePath);
        }
        catch
        {
            // ignore
        }

        return NoContent();
    }
}
