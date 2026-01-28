namespace API.DTOs;

public class UpdateUserDto
{
    public string? Email { get; set; }
    public string? UserName { get; set; }
    public bool? NewsletterOptIn { get; set; }
}
