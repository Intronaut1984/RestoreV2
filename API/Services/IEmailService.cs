using System.Threading.Tasks;
using System.Collections.Generic;

namespace API.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent, string? replyToEmail = null);

    Task<bool> SendEmailWithAttachmentsAsync(
        string toEmail,
        string subject,
        string htmlContent,
        IReadOnlyList<EmailAttachment> attachments);
}
