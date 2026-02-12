using System;

namespace API.Entities.OrderAggregate;

public class OrderIncidentAttachment
{
    public int Id { get; set; }

    public int OrderIncidentId { get; set; }
    public OrderIncident? OrderIncident { get; set; }

    public required string OriginalFileName { get; set; }
    public required string StoredFileName { get; set; }
    public required string ContentType { get; set; }
    public long Size { get; set; }

    // Relative to content root (e.g. Uploads/incidents/123/456/file.png)
    public required string RelativePath { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
