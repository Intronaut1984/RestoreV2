namespace API.Services;

public class EmailAttachment
{
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public required byte[] Content { get; set; }
}
