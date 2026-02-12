using System;

namespace API.RequestHelpers;

public class OrderAdminParams : PaginationParams
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string? Status { get; set; }
    public string? BuyerEmail { get; set; }
    public int? CategoryId { get; set; }
}
