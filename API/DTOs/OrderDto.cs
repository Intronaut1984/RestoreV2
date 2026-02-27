using System;
using API.Entities.OrderAggregate;

namespace API.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public required string BuyerEmail { get; set; }
    public required ShippingAddress ShippingAddress { get; set; }
    public DateTime OrderDate { get; set; } 
    public List<OrderItemDto> OrderItems { get; set; } = [];
    public long Subtotal { get; set; }
    public long DeliveryFee { get; set; }
    public long ProductDiscount { get; set; }
    public long Discount { get; set; }
    public long Total { get; set; }
    public required string OrderStatus { get; set; }
    public required PaymentSummary PaymentSummary { get; set; }

    public string? TrackingNumber { get; set; }
    public DateTime? TrackingAddedAt { get; set; }

    public string? CustomerComment { get; set; }
    public DateTime? CustomerCommentedAt { get; set; }

    public string? AdminCommentReply { get; set; }
    public DateTime? AdminCommentRepliedAt { get; set; }

    public required string RefundRequestStatus { get; set; }
    public DateTime? RefundRequestedAt { get; set; }
    public DateTime? RefundReviewedAt { get; set; }
    public required string RefundReturnMethod { get; set; }
    public string? RefundRequestReason { get; set; }
    public string? RefundReviewNote { get; set; }
}