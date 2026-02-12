namespace API.RequestHelpers;

public class EmailSettings
{
    public string SendGridApiKey { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    // Optional: where incident notifications should be sent (admin inbox)
    public string AdminEmail { get; set; } = string.Empty;
    // Frontend base URL, e.g. https://localhost:3000
    public string FrontendUrl { get; set; } = string.Empty;
    // When true, enable SendGrid sandbox mode to avoid real delivery (useful for dev)
    public bool UseSandbox { get; set; } = false;
}
