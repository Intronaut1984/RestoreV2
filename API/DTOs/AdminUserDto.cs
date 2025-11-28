using System.Collections.Generic;

namespace API.DTOs;

public class AdminUserDto
{
    public string Email { get; set; } = null!;
    public string? UserName { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
}
