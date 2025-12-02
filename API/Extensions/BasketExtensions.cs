using System;
using System.Linq;
using API.DTOs;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Extensions;

public static class BasketExtensions
{
    public static BasketDto ToDto(this Basket basket)
    {
        return new BasketDto
        {
            BasketId = basket.BasketId,
            ClientSecret = basket.ClientSecret,
            Coupon = basket.Coupon,
            Items = basket.Items.Select(x => new BasketItemDto
            {
                ProductId = x.ProductId,
                Name = x.Product?.Name ?? string.Empty,
                // expose price as euros (decimal) to the client
                Price = x.Product?.Price ?? 0m,
                Genero = x.Product?.Genero,
                PictureUrl = x.Product?.PictureUrl ?? string.Empty,
                Quantity = x.Quantity,
                DiscountPercentage = x.Product?.DiscountPercentage
            }).ToList()
        };
    }

    public static async Task<Basket> GetBasketWithItems(this IQueryable<Basket> query,
        string? basketId)
    {
        return await query
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.BasketId == basketId)
                ?? throw new Exception("Cannot get basket");
    }
}