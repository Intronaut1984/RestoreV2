using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using API.Entities;

namespace API.Services;

public interface INewsletterSender
{
    Task<bool> SendNewsletterAsync(
        string toEmail,
        string subject,
        string htmlContent,
        IReadOnlyList<NewsletterAttachment> attachments,
        CancellationToken cancellationToken = default);
}
