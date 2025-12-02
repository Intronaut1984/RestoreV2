using System;
using API.Entities;

namespace API.Extensions;

public static class ProductExtensions
{
    public static IQueryable<Product> Sort(this IQueryable<Product> query, string? orderBy)
    {
        query = orderBy switch
        {
            "price" => query.OrderBy(x => x.Price),
            "priceDesc" => query.OrderByDescending(x => x.Price),
            _ => query.OrderBy(x => x.Name)
        };

        return query;
    }

    public static IQueryable<Product> Search(this IQueryable<Product> query, string? searchTerm)
    {
        if (string.IsNullOrEmpty(searchTerm)) return query;

        var lowerCaseSearchTerm = searchTerm.Trim().ToLower();

        return query.Where(x => x.Name.ToLower().Contains(lowerCaseSearchTerm));
    }

    public static IQueryable<Product> Filter(this IQueryable<Product> query,
        string? generos, string? anos)
    {
        var generoList = new List<string>();
        var anoList = new List<int>();

        if (!string.IsNullOrEmpty(generos))
        {
            generoList.AddRange(generos.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        }

        if (!string.IsNullOrEmpty(anos))
        {
            anoList.AddRange(anos.Split(",", StringSplitOptions.RemoveEmptyEntries)
                .Select(s => { if (int.TryParse(s.Trim(), out var v)) return v; return -1; })
                .Where(v => v > 0));
        }

            if (generoList.Count > 0)
            {
                query = query.Where(x => x.Genero != null && generoList.Contains(x.Genero.ToLower()));
        }

        if (anoList.Count > 0)
        {
            query = query.Where(x => x.PublicationYear != null && anoList.Contains(x.PublicationYear.Value));
        }

        return query;
    }
}
