namespace API.DTOs;

public class ContactDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? WhatsappNumber { get; set; }
    public string? CompanyName { get; set; }
    public string? TaxId { get; set; }
    public DateTime UpdatedAt { get; set; }
}
