using System.Collections.Generic;

namespace API.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    public List<Product>? Products { get; set; }
}
