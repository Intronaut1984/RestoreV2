using System;
using System.Linq;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace API.Controllers;

[Authorize]
public class OrdersController(StoreContext context, IConfiguration config, ILogger<OrdersController> logger, Services.DiscountService discountService) : BaseApiController
{
    private const decimal DefaultRate = 5m;
    private const decimal DefaultFreeShippingThreshold = 100m;

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        var orders = await context.Orders
            .ProjectToDto()
            .Where(x => x.BuyerEmail == User.GetEmail())
            .ToListAsync();

        return orders;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderDetails(int id)
    {
        var order = await context.Orders
            .ProjectToDto()
            .Where(x => x.BuyerEmail == User.GetEmail() && id == x.Id)
            .FirstOrDefaultAsync();

        if (order == null) return NotFound();

        return order;
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto orderDto)
    {
        var basket = await context.Baskets.GetBasketWithItems(Request.Cookies["basketId"]);

        if (basket == null || basket.Items.Count == 0 || string.IsNullOrEmpty(basket.PaymentIntentId))
            return BadRequest("Basket is empty or not found");

        var items = CreateOrderItems(basket.Items);
        if (items == null) return BadRequest("Some items out of stock");
        // items.Price is stored as cents (long) in the OrderItem entity, so subtotal is in cents
        var subtotal = items.Sum(x => x.Price * x.Quantity);
        var deliveryFee = await CalculateDeliveryFeeAsync(subtotal);

        // Compute product-level discounts (difference between original unit price and final unit price)
        long productDiscount = 0;
        foreach (var bItem in basket.Items)
        {
            var product = bItem.Product;

            decimal originalUnit = product.Price;
            decimal finalUnit = product.PromotionalPrice ?? product.Price;

            if (product.DiscountPercentage.HasValue && product.PromotionalPrice == null)
            {
                var d = Math.Max(0, Math.Min(100, product.DiscountPercentage.Value));
                finalUnit = finalUnit * (1 - (d / 100M));
            }

            bool priceLikelyInCents = (product.PromotionalPrice ?? product.Price) > 1000M;
            long originalCents = priceLikelyInCents ? (long)Math.Round(originalUnit) : (long)Math.Round(originalUnit * 100M);
            long finalCents = priceLikelyInCents ? (long)Math.Round(finalUnit) : (long)Math.Round(finalUnit * 100M);

            productDiscount += (originalCents - finalCents) * bItem.Quantity;
        }

        long couponDiscount = 0;
        if (basket.Coupon != null)
        {
            couponDiscount = await discountService.CalculateDiscountFromAmount(basket.Coupon, subtotal);
        }

        long discount = productDiscount + couponDiscount;

        // Diagnostic logging to help investigate discount computation mismatches
        try
        {
            logger.LogInformation("Creating order: subtotal={Subtotal}, productDiscount={ProductDiscount}, couponDiscount={CouponDiscount}, delivery={DeliveryFee}, total={Total}",
                subtotal, productDiscount, couponDiscount, deliveryFee, subtotal - (productDiscount + couponDiscount) + deliveryFee);

            foreach (var bItem in basket.Items)
            {
                logger.LogInformation("Basket item {ProductId} price={Price} promotional={PromotionalPrice} discountPercentage={DiscountPercentage} quantity={Quantity}",
                    bItem.ProductId, bItem.Product.Price, bItem.Product.PromotionalPrice, bItem.Product.DiscountPercentage, bItem.Quantity);
            }
        }
        catch { /* swallow logging errors to avoid impacting order creation */ }

        var order = await context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.PaymentIntentId == basket.PaymentIntentId);

        if (order == null)
        {
                order = new Order
                {
                    OrderItems = items,
                    BuyerEmail = User.GetEmail(),
                    ShippingAddress = orderDto.ShippingAddress,
                    DeliveryFee = deliveryFee,
                    Subtotal = subtotal,
                    Discount = discount,
                    PaymentSummary = orderDto.PaymentSummary,
                    PaymentIntentId = basket.PaymentIntentId
                };

            context.Orders.Add(order);
        }
        else 
        {
            order.OrderItems = items;
        }
        
        // verify payment intent status with Stripe so the order reflects payment status
        try
        {
            if (!string.IsNullOrEmpty(basket.PaymentIntentId))
            {
                StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];
                var paymentService = new PaymentIntentService();
                var intent = await paymentService.GetAsync(basket.PaymentIntentId!);

                if (intent != null)
                {
                    if (intent.Status == "succeeded")
                    {
                        var intentAmount = intent.Amount;
                        if (Math.Abs(order.GetTotal() - intentAmount) > 1)
                        {
                            logger.LogWarning("Payment mismatch for order {OrderId} during creation: orderTotal={OrderTotal}, intentAmount={IntentAmount} - marking as PaymentReceived.", order.Id, order.GetTotal(), intentAmount);
                        }

                        logger.LogInformation("Payment received for order {OrderId} during creation: intent amount {Amount}", order.Id, intentAmount);
                        order.OrderStatus = OrderStatus.PaymentReceived;

                        // Since payment is already confirmed, record sales counts now.
                        await IncrementProductSalesCountsAsync(order);
                    }
                    else if (intent.Status == "requires_payment_method" || intent.Status == "requires_confirmation" || intent.Status == "requires_action")
                    {
                        order.OrderStatus = OrderStatus.Pending;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to verify PaymentIntent for order creation");
            // keep default Pending if verification fails
        }

        var result = await context.SaveChangesAsync() > 0;

        if (!result) return BadRequest("Problem creating order");

        return CreatedAtAction(nameof(GetOrderDetails), new { id = order.Id }, order.ToDto());
    }

    private async Task IncrementProductSalesCountsAsync(Order order)
    {
        // Best-effort: don't block order creation if this fails.
        try
        {
            foreach (var item in order.OrderItems)
            {
                var productId = item.ItemOrdered.ProductId;
                var product = await context.Products.FindAsync(productId);
                if (product == null) continue;

                product.SalesCount += item.Quantity;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to increment SalesCount for order {OrderId}", order.Id);
        }
    }

    private async Task<long> CalculateDeliveryFeeAsync(long subtotal)
    {
        try
        {
            var shipping = await context.ShippingRates.AsNoTracking().FirstOrDefaultAsync();

            var rateEuros = shipping?.Rate ?? DefaultRate;
            var thresholdEuros = shipping?.FreeShippingThreshold ?? DefaultFreeShippingThreshold;

            var rateCents = (long)Math.Round(rateEuros * 100m);
            var thresholdCents = (long)Math.Round(thresholdEuros * 100m);

            if (thresholdCents <= 0) return 0;
            return subtotal > thresholdCents ? 0 : Math.Max(0, rateCents);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load ShippingRate while calculating delivery fee. Falling back to defaults.");
            return subtotal > 10000 ? 0 : 500;
        }
    }

    private List<OrderItem>? CreateOrderItems(List<BasketItem> items)
    {
        var orderItems = new List<OrderItem>();

        foreach (var item in items)
        {
            if (item.Product.QuantityInStock < item.Quantity)
                return null;

            // Determine the unit price taking promotional price or product-level discount into account.
            decimal unitPrice = item.Product.PromotionalPrice ?? item.Product.Price;

            if (item.Product.DiscountPercentage.HasValue && item.Product.PromotionalPrice == null)
            {
                var d = Math.Max(0, Math.Min(100, item.Product.DiscountPercentage.Value));
                unitPrice = unitPrice * (1 - (d / 100M));
            }

            // Heuristic: if unitPrice looks like cents (very large), treat as cents already; otherwise convert euros -> cents
            bool priceLikelyInCents = unitPrice > 1000M;
            long priceInCents = priceLikelyInCents ? (long)Math.Round(unitPrice) : (long)Math.Round(unitPrice * 100M);

            var orderItem = new OrderItem
            {
                ItemOrdered = new ProductItemOrdered
                {
                    ProductId = item.ProductId,
                    PictureUrl = item.Product.PictureUrl,
                    Name = item.Product.Name
                },
                // store price in cents for orders (long)
                Price = priceInCents,
                Quantity = item.Quantity
            };
            orderItems.Add(orderItem);

            item.Product.QuantityInStock -= item.Quantity;
        }

        return orderItems;
    }
}