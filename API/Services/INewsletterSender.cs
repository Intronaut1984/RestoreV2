using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using API.Entities;

namespace API.Services;

public record NewsletterSendResult(bool Ok, string? Error = null);

public interface INewsletterSender
{
    Task<NewsletterSendResult> SendNewsletterAsync(
        string toEmail,
        string subject,
        string htmlContent,
        IReadOnlyList<NewsletterAttachment> attachments,
        CancellationToken cancellationToken = default);
}
