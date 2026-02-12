using System;

namespace API.Entities.OrderAggregate;

public class Order
{
    public int Id { get; set; }
    public required string BuyerEmail { get; set; }
    public required ShippingAddress ShippingAddress { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public List<OrderItem> OrderItems { get; set; } = [];
    public long Subtotal { get; set; }
    public long DeliveryFee { get; set; }
    public long ProductDiscount { get; set; }
    public long Discount { get; set; }
    public required string PaymentIntentId { get; set; }
    public OrderStatus OrderStatus { get; set; } = OrderStatus.Pending;
    public required PaymentSummary PaymentSummary { get; set; }

    public string? CustomerComment { get; set; }
    public DateTime? CustomerCommentedAt { get; set; }

    public string? AdminCommentReply { get; set; }
    public DateTime? AdminCommentRepliedAt { get; set; }

    public OrderIncident? Incident { get; set; }

    public DateTime? ReceiptEmailedAt { get; set; }

    public string? TrackingNumber { get; set; }
    public DateTime? TrackingAddedAt { get; set; }

    public long GetTotal()
    {
        return Subtotal + DeliveryFee - Discount;
    }
}
