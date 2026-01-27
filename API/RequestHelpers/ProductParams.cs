using System;

namespace API.RequestHelpers;

public class ProductParams : PaginationParams
{
    public string? OrderBy { get; set; }
    public string? SearchTerm { get; set; }
    public string? Generos { get; set; }
    public string? Anos { get; set; }
    public string? Marcas { get; set; }
    public string? Modelos { get; set; }
    public string? Tipos { get; set; }
    public string? Capacidades { get; set; }
    public string? Cores { get; set; }
    public string? Materiais { get; set; }
    public string? Tamanhos { get; set; }
    public string? CategoryIds { get; set; }
    public string? CampaignIds { get; set; }
    public bool? HasDiscount { get; set; }
}
