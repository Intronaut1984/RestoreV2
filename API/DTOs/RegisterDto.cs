using System;
using System.ComponentModel.DataAnnotations;

namespace API.DTOs;

public class RegisterDto
{
    [Required]
    public string Email { get; set; } = string.Empty;
    public required string Password { get; set; }

    // Marketing/newsletter emails (default true to match expected behavior)
    public bool NewsletterOptIn { get; set; } = true;
}
