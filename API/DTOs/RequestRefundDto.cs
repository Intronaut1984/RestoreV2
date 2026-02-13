namespace API.DTOs;

public class RequestRefundDto
{
    public string? Reason { get; set; }
    public API.Entities.OrderAggregate.RefundReturnMethod ReturnMethod { get; set; }
}

