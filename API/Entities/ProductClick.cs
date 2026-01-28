using System;
using System.ComponentModel.DataAnnotations;

namespace API.Entities;

public class ProductClick
{
    public int Id { get; set; }

    [Required]
    public int ProductId { get; set; }

    public Product? Product { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Optional: if authenticated we can store the user id
    public string? UserId { get; set; }

    // Client-generated session id (stored in localStorage) so we can dedupe clicks.
    [Required]
    public string SessionId { get; set; } = string.Empty;

    // Optional: lightweight metadata for debugging/abuse detection (no raw PII)
    public string? UserAgent { get; set; }
}