using System;
namespace API.Entities;

public class Favorite
{
    public int Id { get; set; }

    // Identity user id
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }
}
