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
        string? generos, string? anos, string? categoryIds = null, string? campaignIds = null)
    {
        var generoList = new List<string>();
        var anoList = new List<int>();
        var categoryList = new List<int>();
        var campaignList = new List<int>();

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

        if (!string.IsNullOrEmpty(categoryIds))
        {
            categoryList.AddRange(categoryIds.Split(",", StringSplitOptions.RemoveEmptyEntries)
                .Select(s => { if (int.TryParse(s.Trim(), out var v)) return v; return -1; })
                .Where(v => v > 0));
        }

        if (!string.IsNullOrEmpty(campaignIds))
        {
            campaignList.AddRange(campaignIds.Split(",", StringSplitOptions.RemoveEmptyEntries)
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

        // category and campaign filtering are handled in the controller where the DbContext
        // is available to build translatable queries that avoid materializing collection
        // navigations. This extension focuses on simple scalar filters (generos, anos).

        return query;
    }
}
