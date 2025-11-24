using API.Entities;
using Stripe;
using System.Collections.Generic;
using System.Linq;

namespace API.Services;

public class PaymentsService(IConfiguration config, DiscountService discountService)
{
    public async Task<PaymentIntent> CreateOrUpdatePaymentIntent(Basket basket,
        bool removeDiscount = false)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];

        var service = new PaymentIntentService();

        var intent = new PaymentIntent();
        // product.Price is intended to be stored as decimal (euros). However, some data may already be in cents.
        // Compute a subtotalDecimal from the stored Price values; detect if values look like cents and adjust.
        decimal subtotalDecimal = basket.Items.Sum(x => x.Quantity * x.Product.Price);

        // Heuristic: if prices look unusually large (e.g. any price > 1000 or subtotal > 1000), they may already be cents.
        bool pricesLikelyInCents = basket.Items.Any(x => x.Product.Price > 1000M) || subtotalDecimal > 1000M;

        long subtotal;
        if (pricesLikelyInCents)
        {
            // treat subtotalDecimal as already in cents
            subtotal = (long)Math.Round(subtotalDecimal);
        }
        else
        {
            // convert euros -> cents
            subtotal = (long)Math.Round(subtotalDecimal * 100M);
        }

        // delivery fee logic expects cents: free over €100 (10000 cents), otherwise €5 (500 cents)
        long deliveryFee = subtotal > 10000 ? 0 : 500;
        long discount = 0;

        if (basket.Coupon != null)
        {
            discount = await discountService.CalculateDiscountFromAmount(basket.Coupon, subtotal, removeDiscount);
        }

        var totalAmount = subtotal - discount + deliveryFee;

        // Stripe expects amount in cents and has a per-charge limit (commonly €5,000 -> 500000 cents).
        // Provide a clear error if computed amount would exceed Stripe's limit to help debugging.
        const long stripeMaxAmount = 500000; // 5,000.00 EUR in cents
        if (totalAmount > stripeMaxAmount)
        {
            var euros = totalAmount / 100.0M;
            throw new InvalidOperationException($"Computed payment amount {totalAmount} (cents) i.e. €{euros:N2} exceeds Stripe limit of €5,000.00. Note: Stripe expects amounts in cents.");
        }

        if (string.IsNullOrEmpty(basket.PaymentIntentId))
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = totalAmount,
                Currency = "eur",
                PaymentMethodTypes = new List<string> { "card", "multibanco", "mb_way" }
            };
            intent = await service.CreateAsync(options);
        }
        else
        {
            var options = new PaymentIntentUpdateOptions
            {
                Amount = totalAmount
            };
            await service.UpdateAsync(basket.PaymentIntentId, options);
        }

        return intent;
    }
}