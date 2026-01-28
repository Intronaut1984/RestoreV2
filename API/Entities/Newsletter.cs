using System;
using System.Collections.Generic;

namespace API.Entities;

public enum NewsletterStatus
{
    Draft = 0,
    Scheduled = 1,
    Sending = 2,
    Sent = 3,
    Failed = 4,
    Cancelled = 5
}

public class Newsletter
{
    public int Id { get; set; }

    public string Subject { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;

    public NewsletterStatus Status { get; set; } = NewsletterStatus.Draft;

    // When set, the dispatcher will send when due.
    public DateTime? ScheduledForUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? SentAtUtc { get; set; }

    public int TotalRecipients { get; set; }
    public int SentCount { get; set; }
    public int FailedCount { get; set; }

    public string? LastError { get; set; }

    public List<NewsletterAttachment> Attachments { get; set; } = new();
}
