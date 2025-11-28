namespace API.DTOs;

public class UpdateUserRoleDto
{
    public string Email { get; set; } = null!;
    // Expected values: "Admin" or "Member"
    public string Role { get; set; } = null!;
}
