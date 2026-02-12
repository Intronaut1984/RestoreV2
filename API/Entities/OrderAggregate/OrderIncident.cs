using System;
using System.Collections.Generic;

namespace API.Entities.OrderAggregate;

public class OrderIncident
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public required string BuyerEmail { get; set; }

    public IncidentStatus Status { get; set; } = IncidentStatus.Open;

    // Optional: incident relates to a specific product in the order
    public int? ProductId { get; set; }

    public required string Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    public List<OrderIncidentAttachment> Attachments { get; set; } = [];
}
