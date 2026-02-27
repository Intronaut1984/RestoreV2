namespace API.Entities.OrderAggregate;

public enum RefundRequestStatus
{
    None = 0,
    PendingReview = 1,
    Approved = 2,
    Rejected = 3
}
