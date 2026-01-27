namespace API.DTOs;

public class ShippingRateDto
{
    public decimal Rate { get; set; }
    public decimal FreeShippingThreshold { get; set; }
    public DateTime UpdatedAt { get; set; }
}
