namespace API.Entities;

public class ShippingRate
{
    public int Id { get; set; }
    public decimal Rate { get; set; }
    public decimal FreeShippingThreshold { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
