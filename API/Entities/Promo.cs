namespace API.Entities;

public class Promo
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    // color stored as CSS color (hex or color name)
    public string Color { get; set; } = "#050505";
}
