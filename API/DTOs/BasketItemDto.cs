namespace API.DTOs;

public class BasketItemDto
{
    public int ProductId { get; set; }
    public required string Name { get; set; }
    // Price in euros (decimal) to match frontend numeric representation
    public decimal Price { get; set; }
    public required string PictureUrl { get; set; }
    public string? Genero { get; set; }
    public int Quantity { get; set; }
}