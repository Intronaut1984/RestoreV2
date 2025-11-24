using System;

namespace API.RequestHelpers;

public class ProductParams : PaginationParams
{
    public string? OrderBy { get; set; }
    public string? SearchTerm { get; set; }
    public string? Generos { get; set; }
    public string? Anos { get; set; }
}
