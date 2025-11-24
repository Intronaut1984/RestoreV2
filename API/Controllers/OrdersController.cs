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
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        var orders = await context.Orders
            .ProjectToDto()
            .Where(x => x.BuyerEmail == User.GetUsername())
            .ToListAsync();

        return orders;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderDetails(int id)
    {
        var order = await context.Orders
            .ProjectToDto()
            .Where(x => x.BuyerEmail == User.GetUsername() && id == x.Id)
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
        var deliveryFee = CalculateDeliveryFee(subtotal);
        long discount = 0;

        if (basket.Coupon != null)
        {
            discount = await discountService.CalculateDiscountFromAmount(basket.Coupon, subtotal);
        }

        var order = await context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.PaymentIntentId == basket.PaymentIntentId);

        if (order == null)
        {
            order = new Order
            {
                OrderItems = items,
                BuyerEmail = User.GetUsername(),
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
                        if (order.GetTotal() == intent.Amount)
                            order.OrderStatus = OrderStatus.PaymentReceived;
                        else
                            order.OrderStatus = OrderStatus.PaymentMismatch;
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

    private long CalculateDeliveryFee(long subtotal)
    {
        return subtotal > 10000 ? 0 : 500;
    }

    private List<OrderItem>? CreateOrderItems(List<BasketItem> items)
    {
        var orderItems = new List<OrderItem>();

        foreach (var item in items)
        {
            if (item.Product.QuantityInStock < item.Quantity)
                return null;

            var orderItem = new OrderItem
            {
                ItemOrdered = new ProductItemOrdered
                {
                    ProductId = item.ProductId,
                    PictureUrl = item.Product.PictureUrl,
                    Name = item.Product.Name
                },
                // store price in cents for orders (long)
                Price = (long)Math.Round(item.Product.Price * 100M),
                Quantity = item.Quantity
            };
            orderItems.Add(orderItem);

            item.Product.QuantityInStock -= item.Quantity;
        }

        return orderItems;
    }
}