namespace API.Entities.OrderAggregate;

public enum OrderStatus
{
    Pending,
    PaymentReceived,
    PaymentFailed,
    PaymentMismatch,
    Processing,
    Processed,
    Shipped,
    Delivered,
    Cancelled,
    ReviewRequested,
    Completed
}