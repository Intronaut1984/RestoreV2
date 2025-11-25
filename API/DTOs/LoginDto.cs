namespace API.DTOs;

public class LoginDto
{
    public string Identifier { get; set; } = string.Empty; // username or email
    public string Password { get; set; } = string.Empty;
}
