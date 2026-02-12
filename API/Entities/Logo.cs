namespace API.Entities;

public class Logo
{
    public int Id { get; set; }
    public string Url { get; set; } = "/images/logo.png";
    public string? PublicId { get; set; }
    public decimal Scale { get; set; } = 1.0m;
}

