using System.Collections.Generic;
namespace API.Entities;

public class HeroBlock
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public bool Visible { get; set; } = true;
    public int Order { get; set; }
    public ICollection<HeroBlockImage>? Images { get; set; }
}
