using System;

namespace API.DTOs;

public class ProductReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int OrderId { get; set; }
    public required string BuyerEmail { get; set; }
    public int Rating { get; set; }
    public required string Comment { get; set; }
    public string? AdminReply { get; set; }
    public DateTime? AdminRepliedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
