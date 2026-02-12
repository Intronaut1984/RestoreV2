using System;

namespace API.Entities;

public class ProductVariant
{
    public int Id { get; set; }

    public int ProductId { get; set; }
    public required Product Product { get; set; }

    public required string Color { get; set; }

    public int QuantityInStock { get; set; }

    // Optional overrides; when null, fallback to Product.*
    public decimal? PriceOverride { get; set; }
    public string? DescriptionOverride { get; set; }

    public string? PictureUrl { get; set; }
    public string? PublicId { get; set; }

    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
