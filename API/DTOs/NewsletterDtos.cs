using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using API.Entities;

namespace API.DTOs;

public class NewsletterAttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime UploadedAtUtc { get; set; }
}

public class NewsletterDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;

    public NewsletterStatus Status { get; set; }
    public DateTime? ScheduledForUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }

    public int TotalRecipients { get; set; }
    public int SentCount { get; set; }
    public int FailedCount { get; set; }
    public string? LastError { get; set; }

    public List<NewsletterAttachmentDto> Attachments { get; set; } = new();
}

public class CreateNewsletterDto
{
    public string? Subject { get; set; }

    public string? HtmlContent { get; set; }

    // If set, status becomes Scheduled.
    public DateTime? ScheduledForUtc { get; set; }
}

public class UpdateNewsletterDto
{
    public string? Subject { get; set; }

    public string? HtmlContent { get; set; }

    public DateTime? ScheduledForUtc { get; set; }
    public NewsletterStatus? Status { get; set; }
}

public class NewsletterRecipientDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public bool EmailConfirmed { get; set; }
    public bool NewsletterOptIn { get; set; }
}
