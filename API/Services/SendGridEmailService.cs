using System.Threading.Tasks;
using API.RequestHelpers;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace API.Services;

public class SendGridEmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public SendGridEmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        if (string.IsNullOrWhiteSpace(_settings.SendGridApiKey)) return false;

        var client = new SendGridClient(_settings.SendGridApiKey);
        var from = new EmailAddress(_settings.FromEmail, _settings.FromName);
        var to = new EmailAddress(toEmail);
        var plain = StripHtml(htmlContent);
        var msg = MailHelper.CreateSingleEmail(from, to, subject, plain, htmlContent);

        // If configured for sandbox/dev mode, enable SendGrid sandbox (won't deliver)
        if (_settings is { } && _settings.GetType().GetProperty("UseSandbox") != null)
        {
            // try to read a UseSandbox property if present (backwards-compatible)
            var prop = _settings.GetType().GetProperty("UseSandbox");
            if (prop != null && prop.GetValue(_settings) is bool useSandbox && useSandbox)
            {
                msg.MailSettings = new MailSettings { SandboxMode = new SandboxMode { Enable = true } };
            }
        }

        try
        {
            var response = await client.SendEmailAsync(msg);
            var body = response.Body?.ToString() ?? string.Empty;
            System.Console.WriteLine($"SendGrid send finished. Status: {response.StatusCode}. Body: {body}");
            return response.IsSuccessStatusCode;
        }
        catch (System.Exception ex)
        {
            System.Console.WriteLine($"SendGrid exception: {ex}");
            return false;
        }
    }

    private static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        // Very small utility to produce a plain-text fallback
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
