using System;
using Microsoft.EntityFrameworkCore;

namespace API.Entities.OrderAggregate;

[Owned]
public class ProductItemOrdered
{
    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }
    public string? VariantColor { get; set; }
    public required string Name { get; set; }
    public required string PictureUrl { get; set; }
}
