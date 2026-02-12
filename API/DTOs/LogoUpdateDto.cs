namespace API.DTOs;

public class LogoUpdateDto
{
    public string? Url { get; set; }
    public IFormFile? File { get; set; }
    // Read as string so multipart binding is culture-agnostic; parse manually in controller.
    public string? Scale { get; set; }
}
