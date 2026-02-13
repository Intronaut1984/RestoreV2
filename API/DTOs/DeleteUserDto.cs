namespace API.DTOs;

public class DeleteUserDto
{
    public string Email { get; set; } = string.Empty;

    public bool DeleteStoredData { get; set; }
}
