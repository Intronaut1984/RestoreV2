using System;

namespace API.Entities;

public class Basket
{
    public int Id { get; set; }
    public required string BasketId { get; set; }
    public List<BasketItem> Items { get; set; } = [];
    public string? ClientSecret { get; set; }
    public string? PaymentIntentId { get; set; }
    public AppCoupon? Coupon { get; set; }

    public void AddItem(Product product, int quantity, ProductVariant? variant = null)
    {
        if (product == null) ArgumentNullException.ThrowIfNull(product);
        if (quantity <= 0) throw new ArgumentException("Quantity should be greater than zero", 
            nameof(quantity));

        var existingItem = FindItem(product.Id, variant?.Id);

        if (existingItem == null)
        {
            Items.Add(new BasketItem
            {
                Product = product,
                ProductVariantId = variant?.Id,
                ProductVariant = variant,
                Quantity = quantity
            });
        }
        else
        {
            existingItem.Quantity += quantity;
        }
    }

    public void RemoveItem(int productId, int quantity, int? variantId = null)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity should be greater than zero", 
            nameof(quantity));

        var item = FindItem(productId, variantId);
        if (item == null) return;

        item.Quantity -= quantity;
        if (item.Quantity <= 0) Items.Remove(item);
    }

    private BasketItem? FindItem(int productId, int? variantId)
    {
        return Items.FirstOrDefault(item => item.ProductId == productId && item.ProductVariantId == variantId);
    }
}