namespace API.DTOs;

public class UpdateOrderStatusDto
{
    public required string Status { get; set; }
    public string? TrackingNumber { get; set; }
}
