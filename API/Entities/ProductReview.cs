using System;

namespace API.Entities;

public class ProductReview
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    // The order that proves the purchase (keeps reviews tied to real sales)
    public int OrderId { get; set; }

    public required string BuyerEmail { get; set; }

    // 1..5
    public int Rating { get; set; }

    public required string Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
