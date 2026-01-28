using System;

namespace API.Entities;

public class NewsletterAttachment
{
    public int Id { get; set; }

    public int NewsletterId { get; set; }
    public Newsletter Newsletter { get; set; } = null!;

    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }

    // Stored server-side (not publicly served). Controller can stream it to admins if needed.
    public string StoragePath { get; set; } = string.Empty;

    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}
