using System;
using System.Collections.Generic;
using API.Entities.OrderAggregate;

namespace API.DTOs;

public class OrderIncidentDto
{
    public int? Id { get; set; }
    public int OrderId { get; set; }
    public string BuyerEmail { get; set; } = string.Empty;
    public IncidentStatus Status { get; set; } = IncidentStatus.None;
    public int? ProductId { get; set; }
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<OrderIncidentAttachmentDto> Attachments { get; set; } = [];
}
