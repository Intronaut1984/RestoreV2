namespace API.Entities;

public class HeroBlockImage
{
    public int Id { get; set; }
    public int HeroBlockId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? PublicId { get; set; }
    public int Order { get; set; }
    public HeroBlock? HeroBlock { get; set; }
}
