using System;
using API.Data;
using API.DTOs;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace API.Controllers;

public class PaymentsController(PaymentsService paymentsService,
    StoreContext context, IConfiguration config, ILogger<PaymentsController> logger)
        : BaseApiController
{
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<BasketDto>> CreateOrUpdatePaymentIntent()
    {
        var basket = await context.Baskets.GetBasketWithItems(Request.Cookies["basketId"]);

        if (basket == null) return BadRequest("Problem with the basket");

        var intent = await paymentsService.CreateOrUpdatePaymentIntent(basket);

        if (intent == null) return BadRequest("Problem creating payment intent");

        // Always set the basket PaymentIntentId and ClientSecret to the returned intent
        // (the service may have created a fresh PaymentIntent when the previous one was terminal).
        basket.PaymentIntentId = intent.Id;
        basket.ClientSecret = intent.ClientSecret;

        if (context.ChangeTracker.HasChanges())
        {
            var result = await context.SaveChangesAsync() > 0;

            if (!result) return BadRequest("Problem updating basket with intent");
        }

        return basket.ToDto();
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> StripeWebhook()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();

        try
        {
            var stripeEvent = ConstructStripeEvent(json);

            if (stripeEvent.Data.Object is not PaymentIntent intent)
            {
                return BadRequest("Invalid event data");
            }

            if (intent.Status == "succeeded") await HandlePaymentIntentSucceeded(intent);
            else await HandlePaymentIntentFailed(intent);

            return Ok();
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe webhook error");
            return StatusCode(StatusCodes.Status500InternalServerError, "Webhook error");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An expected error has occurred");
            return StatusCode(StatusCodes.Status500InternalServerError, "Unexpected error");
        }
    }

    private async Task HandlePaymentIntentFailed(PaymentIntent intent)
    {
        var order = await context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.PaymentIntentId == intent.Id)
                ?? throw new Exception("Order not found");

        foreach (var item in order.OrderItems)
        {
            var productItem = await context.Products
                .FindAsync(item.ItemOrdered.ProductId)
                    ?? throw new Exception("Problem updating order stock");

            productItem.QuantityInStock += item.Quantity;
        }

        order.OrderStatus = OrderStatus.PaymentFailed;

        await context.SaveChangesAsync();
    }

    private async Task HandlePaymentIntentSucceeded(PaymentIntent intent)
    {
        var order = await context.Orders
           .Include(x => x.OrderItems)
           .FirstOrDefaultAsync(x => x.PaymentIntentId == intent.Id)
               ?? throw new Exception("Order not found");
        var intentAmount = intent.Amount;
        // Log amounts to help diagnose mismatches
        logger.LogInformation("Stripe webhook succeeded for intent {IntentId}: intentAmount={IntentAmount}. Order {OrderId} totals: subtotal={Subtotal}, delivery={DeliveryFee}, discount={Discount}, computedTotal={OrderTotal}.",
            intent.Id, intentAmount, order.Id, order.Subtotal, order.DeliveryFee, order.Discount, order.GetTotal());

        // Mark the order as received when Stripe reports success. Keep a warning log
        // if amounts differ so admins can investigate, but don't treat Stripe success
        // as a mismatch that prevents the order from being fulfilled.
        if (Math.Abs(order.GetTotal() - intentAmount) > 1)
        {
            logger.LogWarning("Payment mismatch for order {OrderId}: orderTotal={OrderTotal}, intentAmount={IntentAmount} - marking as PaymentReceived due to Stripe success.", order.Id, order.GetTotal(), intentAmount);
        }

        logger.LogInformation("Payment received for order {OrderId}: intent amount {Amount}", order.Id, intentAmount);
        if (order.OrderStatus != OrderStatus.PaymentReceived)
        {
            await IncrementProductSalesCountsAsync(order);
            order.OrderStatus = OrderStatus.PaymentReceived;
        }

        var basket = await context.Baskets.FirstOrDefaultAsync(x => 
            x.PaymentIntentId == intent.Id);
            
        if (basket != null) context.Baskets.Remove(basket);

        await context.SaveChangesAsync();
    }

    private async Task IncrementProductSalesCountsAsync(Order order)
    {
        foreach (var item in order.OrderItems)
        {
            var productId = item.ItemOrdered.ProductId;
            var product = await context.Products.FindAsync(productId)
                ?? throw new Exception("Problem updating product sales count");

            product.SalesCount += item.Quantity;
        }
    }

    private Event ConstructStripeEvent(string json)
    {
        try
        {
            return EventUtility.ConstructEvent(json,
                Request.Headers["Stripe-Signature"], config["StripeSettings:WhSecret"]);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to construct stripe event");
            throw new StripeException("Invalid signature");
        }
    }
}