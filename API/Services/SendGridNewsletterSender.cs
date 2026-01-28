using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using API.Entities;
using API.RequestHelpers;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace API.Services;

public class SendGridNewsletterSender : INewsletterSender
{
    private readonly EmailSettings _settings;

    public SendGridNewsletterSender(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task<bool> SendNewsletterAsync(
        string toEmail,
        string subject,
        string htmlContent,
        IReadOnlyList<NewsletterAttachment> attachments,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.SendGridApiKey)) return false;
        if (string.IsNullOrWhiteSpace(toEmail)) return false;

        var client = new SendGridClient(_settings.SendGridApiKey);
        var from = new EmailAddress(_settings.FromEmail, _settings.FromName);
        var to = new EmailAddress(toEmail);
        var plain = StripHtml(htmlContent);
        var msg = MailHelper.CreateSingleEmail(from, to, subject, plain, htmlContent);

        // Attach files (SendGrid expects base64 content)
        foreach (var a in attachments)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(a.StoragePath) || !File.Exists(a.StoragePath)) continue;

                // Keep memory bounded: reject very large attachments
                if (a.SizeBytes > 10 * 1024 * 1024) continue;

                var bytes = await File.ReadAllBytesAsync(a.StoragePath, cancellationToken);
                var base64 = Convert.ToBase64String(bytes);

                msg.AddAttachment(a.FileName, base64, a.ContentType, "attachment");
            }
            catch
            {
                // ignore individual attachment errors; still try to deliver
            }
        }

        if (_settings.UseSandbox)
        {
            msg.MailSettings = new MailSettings { SandboxMode = new SandboxMode { Enable = true } };
        }

        try
        {
            var response = await client.SendEmailAsync(msg, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        try
        {
            var withoutTags = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", string.Empty);
            return System.Net.WebUtility.HtmlDecode(withoutTags);
        }
        catch
        {
            return html ?? string.Empty;
        }
    }
}
