using System.Text.Json.Serialization;

namespace API.DTOs;

public class DimensionsDto
{
    [JsonPropertyName("altura")]
    public int? Altura { get; set; }

    [JsonPropertyName("largura")]
    public int? Largura { get; set; }

    [JsonPropertyName("espessura")]
    public int? Espessura { get; set; }
}
