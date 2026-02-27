using System;
using API.DTOs;
using API.Entities.OrderAggregate;
using Microsoft.EntityFrameworkCore;

namespace API.Extensions;

public static class OrderExtensions
{
    public static IQueryable<OrderDto> ProjectToDto(this IQueryable<Order> query)
    {
        return query.Select(order => new OrderDto
        {
            Id = order.Id,
            BuyerEmail = order.BuyerEmail,
            OrderDate = order.OrderDate,
            ShippingAddress = order.ShippingAddress,
            PaymentSummary = order.PaymentSummary,
            DeliveryFee = order.DeliveryFee,
            Subtotal = order.Subtotal,
            ProductDiscount = order.ProductDiscount,
            Discount = order.Discount,
            OrderStatus = order.OrderStatus.ToString(),
            Total = order.GetTotal(),
            TrackingNumber = order.TrackingNumber,
            TrackingAddedAt = order.TrackingAddedAt,
            CustomerComment = order.CustomerComment,
            CustomerCommentedAt = order.CustomerCommentedAt,
            AdminCommentReply = order.AdminCommentReply,
            AdminCommentRepliedAt = order.AdminCommentRepliedAt,
            RefundRequestStatus = order.RefundRequestStatus.ToString(),
            RefundRequestedAt = order.RefundRequestedAt,
            RefundReviewedAt = order.RefundReviewedAt,
            RefundReturnMethod = order.RefundReturnMethod.ToString(),
            RefundRequestReason = order.RefundRequestReason,
            RefundReviewNote = order.RefundReviewNote,
            OrderItems = order.OrderItems.Select(item => new OrderItemDto
            {
                ProductId = item.ItemOrdered.ProductId,
                ProductVariantId = item.ItemOrdered.ProductVariantId,
                VariantColor = item.ItemOrdered.VariantColor,
                Name = item.ItemOrdered.Name,
                PictureUrl = item.ItemOrdered.PictureUrl,
                Price = item.Price,
                Quantity = item.Quantity
            }).ToList()
        }).AsNoTracking();
    }

    public static OrderDto ToDto(this Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            BuyerEmail = order.BuyerEmail,
            OrderDate = order.OrderDate,
            ShippingAddress = order.ShippingAddress,
            PaymentSummary = order.PaymentSummary,
            DeliveryFee = order.DeliveryFee,
            Subtotal = order.Subtotal,
            ProductDiscount = order.ProductDiscount,
            Discount = order.Discount,
            OrderStatus = order.OrderStatus.ToString(),
            Total = order.GetTotal(),
            TrackingNumber = order.TrackingNumber,
            TrackingAddedAt = order.TrackingAddedAt,
            CustomerComment = order.CustomerComment,
            CustomerCommentedAt = order.CustomerCommentedAt,
            AdminCommentReply = order.AdminCommentReply,
            AdminCommentRepliedAt = order.AdminCommentRepliedAt,
            RefundRequestStatus = order.RefundRequestStatus.ToString(),
            RefundRequestedAt = order.RefundRequestedAt,
            RefundReviewedAt = order.RefundReviewedAt,
            RefundReturnMethod = order.RefundReturnMethod.ToString(),
            RefundRequestReason = order.RefundRequestReason,
            RefundReviewNote = order.RefundReviewNote,
            OrderItems = order.OrderItems.Select(item => new OrderItemDto
            {
                ProductId = item.ItemOrdered.ProductId,
                ProductVariantId = item.ItemOrdered.ProductVariantId,
                VariantColor = item.ItemOrdered.VariantColor,
                Name = item.ItemOrdered.Name,
                PictureUrl = item.ItemOrdered.PictureUrl,
                Price = item.Price,
                Quantity = item.Quantity
            }).ToList()
        };
    }
}