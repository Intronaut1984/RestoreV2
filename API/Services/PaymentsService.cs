using API.Entities;
using API.Data;
using Stripe;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class PaymentsService(IConfiguration config, DiscountService discountService, StoreContext context)
{
    private const decimal DefaultRate = 5m;
    private const decimal DefaultFreeShippingThreshold = 100m;

    public async Task<PaymentIntent> CreateOrUpdatePaymentIntent(Basket basket,
        bool removeDiscount = false)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];

        var service = new PaymentIntentService();

        var intent = new PaymentIntent();
        // Compute per-item unit price using PromotionalPrice (if present), otherwise apply DiscountPercentage
        // to the stored Product.Price. Product.Price is intended to be in euros, but legacy data may be in cents.
        decimal subtotalDecimal = 0M;

        foreach (var item in basket.Items)
        {
            var product = item.Product;

            // Determine unit price in the same scale as stored values (assume euros unless heuristic below detects cents)
            decimal unitPrice = product.PromotionalPrice ?? product.Price;

            if (product.DiscountPercentage.HasValue && (product.PromotionalPrice == null))
            {
                var d = Math.Max(0, Math.Min(100, product.DiscountPercentage.Value));
                unitPrice = unitPrice * (1 - (d / 100M));
            }

            subtotalDecimal += item.Quantity * unitPrice;
        }

        // Heuristic: if prices look unusually large (e.g. any unit price > 1000 or subtotal > 1000), they may already be cents.
        bool pricesLikelyInCents = basket.Items.Any(x => (x.Product.PromotionalPrice ?? x.Product.Price) > 1000M) || subtotalDecimal > 1000M;

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

        // delivery fee logic expects cents and is configured via ShippingRates (defaults to prior behavior)
        long deliveryFee;
        try
        {
            var shipping = await context.ShippingRates.AsNoTracking().FirstOrDefaultAsync();
            var rateEuros = shipping?.Rate ?? DefaultRate;
            var thresholdEuros = shipping?.FreeShippingThreshold ?? DefaultFreeShippingThreshold;

            var rateCents = (long)Math.Round(rateEuros * 100m);
            var thresholdCents = (long)Math.Round(thresholdEuros * 100m);

            if (thresholdCents <= 0) deliveryFee = 0;
            else deliveryFee = subtotal > thresholdCents ? 0 : Math.Max(0, rateCents);
        }
        catch
        {
            deliveryFee = subtotal > 10000 ? 0 : 500;
        }
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
            // Try to fetch existing intent to check its status. If it's in a terminal/non-updatable state
            // (for example 'succeeded') we must create a new PaymentIntent instead of updating it.
            try
            {
                var existing = await service.GetAsync(basket.PaymentIntentId);

                var updatableStatuses = new[] { "requires_payment_method", "requires_confirmation", "requires_action" };

                if (existing == null || !updatableStatuses.Contains(existing.Status))
                {
                    // create a new PaymentIntent
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
                    intent = await service.UpdateAsync(basket.PaymentIntentId, options);
                }
            }
            catch (StripeException)
            {
                // If something goes wrong fetching/updating the existing intent, create a new one as a safe fallback.
                var options = new PaymentIntentCreateOptions
                {
                    Amount = totalAmount,
                    Currency = "eur",
                    PaymentMethodTypes = new List<string> { "card", "multibanco", "mb_way" }
                };
                intent = await service.CreateAsync(options);
            }
        }

        return intent;
    }
}