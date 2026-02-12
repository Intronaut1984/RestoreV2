using System;
using System.Linq;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.RequestHelpers;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace API.Controllers;

[Authorize]
public class OrdersController(
    StoreContext context,
    IConfiguration config,
    ILogger<OrdersController> logger,
    API.Services.DiscountService discountService,
    IEmailService emailService,
    IOptions<EmailSettings> emailOptions,
    IInvoicePdfService invoicePdfService) : BaseApiController
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

    [HttpGet("{id:int}/invoice")]
    public async Task<IActionResult> DownloadReceipt(int id, CancellationToken ct)
    {
        var order = await context.Orders
            .AsNoTracking()
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id && o.BuyerEmail == User.GetEmail(), ct);

        if (order == null) return NotFound();

        if (order.OrderStatus == OrderStatus.Pending || order.OrderStatus == OrderStatus.PaymentFailed)
            return BadRequest("Recibo indisponível para esta encomenda");

        var pdfBytes = await invoicePdfService.GenerateReceiptPdfAsync(order, ct);
        return File(pdfBytes, "application/pdf", $"recibo-{order.Id}.pdf");
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<List<OrderDto>>> GetAllSales([FromQuery] OrderAdminParams queryParams)
    {
        var ordersQuery = context.Orders
            .AsNoTracking()
            .Where(o => o.OrderStatus != OrderStatus.Pending && o.OrderStatus != OrderStatus.PaymentFailed)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.Status) &&
            Enum.TryParse<OrderStatus>(queryParams.Status.Trim(), ignoreCase: true, out var status))
        {
            ordersQuery = ordersQuery.Where(o => o.OrderStatus == status);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.BuyerEmail))
        {
            var needle = queryParams.BuyerEmail.Trim();
            ordersQuery = ordersQuery.Where(o => o.BuyerEmail.Contains(needle));
        }

        if (queryParams.From.HasValue || queryParams.To.HasValue)
        {
            var start = queryParams.From?.Date ?? DateTime.MinValue;
            var end = queryParams.To?.Date.AddDays(1).AddTicks(-1) ?? DateTime.MaxValue;
            ordersQuery = ordersQuery.Where(o => o.OrderDate >= start && o.OrderDate <= end);
        }

        if (queryParams.CategoryId.HasValue && queryParams.CategoryId.Value > 0)
        {
            var productIds = await FilterProductIdsByCategory(queryParams.CategoryId.Value);
            if (productIds.Count == 0)
            {
                ordersQuery = ordersQuery.Where(_ => false);
            }
            else
            {
                ordersQuery = ordersQuery.Where(o => o.OrderItems.Any(oi => productIds.Contains(oi.ItemOrdered.ProductId)));
            }
        }

        var dtoQuery = ordersQuery
            .OrderByDescending(o => o.OrderDate)
            .ProjectToDto();

        var paged = await PagedList<OrderDto>.ToPagedList(dtoQuery, queryParams.PageNumber, queryParams.PageSize);

        Response.AddPaginationHeader(paged.Metadata);

        return paged;
    }

    private async Task<List<int>> FilterProductIdsByCategory(int categoryId)
    {
        return await context.Set<Dictionary<string, object>>("CategoryProduct")
            .AsNoTracking()
            .Where(cp => EF.Property<int>(cp, "CategoriesId") == categoryId)
            .Select(cp => EF.Property<int>(cp, "ProductsId"))
            .Distinct()
            .ToListAsync();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all/{id:int}")]
    public async Task<ActionResult<OrderDto>> GetAnyOrderDetails(int id)
    {
        var order = await context.Orders
            .ProjectToDto()
            .Where(x => id == x.Id)
            .FirstOrDefaultAsync();

        if (order == null) return NotFound();

        return order;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all/{id:int}/invoice")]
    public async Task<IActionResult> DownloadAnyReceipt(int id, CancellationToken ct)
    {
        var order = await context.Orders
            .AsNoTracking()
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null) return NotFound();

        if (order.OrderStatus == OrderStatus.Pending || order.OrderStatus == OrderStatus.PaymentFailed)
            return BadRequest("Recibo indisponível para esta encomenda");

        var pdfBytes = await invoicePdfService.GenerateReceiptPdfAsync(order, ct);
        return File(pdfBytes, "application/pdf", $"recibo-{order.Id}.pdf");
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("all/{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Status)) return BadRequest("Invalid status");

        if (!Enum.TryParse<OrderStatus>(dto.Status.Trim(), ignoreCase: true, out var newStatus))
            return BadRequest("Unknown status");

        var allowed = new HashSet<OrderStatus>
        {
            OrderStatus.PaymentReceived,
            OrderStatus.Processing,
            OrderStatus.Processed,
            OrderStatus.Shipped,
            OrderStatus.Delivered,
            OrderStatus.Cancelled,
            OrderStatus.ReviewRequested
        };

        if (!allowed.Contains(newStatus)) return BadRequest("Status not allowed");

        var order = await context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        order.OrderStatus = newStatus;

        var saved = await context.SaveChangesAsync() > 0;
        if (!saved) return BadRequest("Problem updating order status");

        await TrySendStatusEmail(order, newStatus);

        var updated = await context.Orders
            .ProjectToDto()
            .Where(x => x.Id == id)
            .FirstOrDefaultAsync();

        return updated == null ? Ok() : Ok(updated);
    }

    [HttpPost("{id:int}/comment")]
    public async Task<ActionResult> AddOrderComment(int id, [FromBody] OrderCommentDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Comment)) return BadRequest("Comentário inválido");

        var comment = dto.Comment.Trim();
        if (comment.Length < 3) return BadRequest("Comentário demasiado curto");
        if (comment.Length > 1000) return BadRequest("Comentário demasiado longo");

        var order = await context.Orders.FirstOrDefaultAsync(o => o.Id == id && o.BuyerEmail == User.GetEmail());
        if (order == null) return NotFound();

        if (order.OrderStatus != OrderStatus.ReviewRequested)
            return BadRequest("Esta encomenda não está disponível para avaliação");

        if (!string.IsNullOrWhiteSpace(order.CustomerComment))
            return BadRequest("Já existe um comentário para esta encomenda");

        order.CustomerComment = comment;
        order.CustomerCommentedAt = DateTime.UtcNow;

        var saved = await context.SaveChangesAsync() > 0;
        if (!saved) return BadRequest("Problem saving comment");

        return NoContent();
    }

    private async Task TrySendStatusEmail(Order order, OrderStatus newStatus)
    {
        try
        {
            var frontend = emailOptions.Value.FrontendUrl?.TrimEnd('/') ?? string.Empty;
            var orderUrl = string.IsNullOrWhiteSpace(frontend) ? string.Empty : $"{frontend}/orders/{order.Id}";

            var subject = newStatus switch
            {
                OrderStatus.PaymentReceived => $"Encomenda #{order.Id}: A aguardar",
                OrderStatus.Processing => $"Encomenda #{order.Id}: Em processamento",
                OrderStatus.Processed => $"Encomenda #{order.Id}: Processado",
                OrderStatus.Shipped => $"Encomenda #{order.Id}: Enviado",
                OrderStatus.Delivered => $"Encomenda #{order.Id}: Entregue",
                OrderStatus.Cancelled => $"Encomenda #{order.Id}: Cancelado",
                OrderStatus.ReviewRequested => $"Encomenda #{order.Id}: Para avaliação",
                _ => $"Atualização da encomenda #{order.Id}"
            };

            var headline = newStatus switch
            {
                OrderStatus.PaymentReceived => "A sua encomenda está a aguardar tratamento.",
                OrderStatus.Processing => "A sua encomenda está em processamento.",
                OrderStatus.Processed => "A sua encomenda foi processada.",
                OrderStatus.Shipped => "A sua encomenda foi enviada.",
                OrderStatus.Delivered => "A sua encomenda foi entregue.",
                OrderStatus.Cancelled => "A sua encomenda foi cancelada.",
                OrderStatus.ReviewRequested => "Como correu a sua encomenda? Pode deixar um comentário.",
                _ => "A sua encomenda foi atualizada."
            };

            var extra = newStatus == OrderStatus.ReviewRequested && !string.IsNullOrWhiteSpace(orderUrl)
                ? $"<p>Deixe o seu comentário aqui: <a href=\"{orderUrl}\">{orderUrl}</a></p>"
                : (!string.IsNullOrWhiteSpace(orderUrl) ? $"<p>Ver encomenda: <a href=\"{orderUrl}\">{orderUrl}</a></p>" : string.Empty);

            var html = $"""
                <div style='font-family: Arial, sans-serif; line-height: 1.5'>
                  <h2>Restore</h2>
                  <p>{headline}</p>
                  <p><strong>Encomenda:</strong> #{order.Id}</p>
                  {extra}
                </div>
                """;

            await emailService.SendEmailAsync(order.BuyerEmail, subject, html);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send order status email for order {OrderId}", order.Id);
        }
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

        // Product-level discount is already reflected in the item prices/subtotal.
        // We still compute it here for display/analytics purposes, but it must NOT be subtracted again from totals.
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

            productDiscount += Math.Max(0, (originalCents - finalCents)) * bItem.Quantity;
        }

        long couponDiscount = 0;
        if (basket.Coupon != null)
        {
            couponDiscount = await discountService.CalculateDiscountFromAmount(basket.Coupon, subtotal);
        }

        // NOTE: Product-level discounts are already applied when building OrderItems (see CreateOrderItems)
        // and therefore reflected in `subtotal`. Only coupon discounts should be stored in Order.Discount.
        long discount = couponDiscount;

        // Diagnostic logging to help investigate discount computation mismatches
        try
        {
            logger.LogInformation("Creating order: subtotal={Subtotal}, productDiscount={ProductDiscount}, couponDiscount={CouponDiscount}, delivery={DeliveryFee}, total={Total}",
                subtotal, productDiscount, couponDiscount, deliveryFee, subtotal - couponDiscount + deliveryFee);

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
                    ProductDiscount = productDiscount,
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
                    PictureUrl = item.Product.PictureUrl ?? string.Empty,
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