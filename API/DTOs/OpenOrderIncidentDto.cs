using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace API.DTOs;

public class OpenOrderIncidentDto
{
    public int? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;

    // Use multipart/form-data with key 'files'
    public List<IFormFile> Files { get; set; } = [];
}
