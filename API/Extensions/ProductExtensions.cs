using System;
using API.Entities;

namespace API.Extensions;

public static class ProductExtensions
{
    public static IQueryable<Product> Sort(this IQueryable<Product> query, string? orderBy)
    {
        if (string.IsNullOrEmpty(orderBy)) return query.OrderBy(x => x.Name);

        // support discount-based sorting: prefer explicit DiscountPercentage, then fallback to absolute promotional amount
        if (orderBy == "discountDesc")
        {
            return query.OrderByDescending(x => x.DiscountPercentage ?? 0)
                        .ThenByDescending(x => x.PromotionalPrice.HasValue ? (x.Price - x.PromotionalPrice.Value) : 0m);
        }

        if (orderBy == "discount")
        {
            return query.OrderBy(x => x.DiscountPercentage ?? 0)
                        .ThenBy(x => x.PromotionalPrice.HasValue ? (x.Price - x.PromotionalPrice.Value) : 0m);
        }

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
        string? generos, string? anos, bool? hasDiscount = null)
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

        // category and campaign lists are parsed in controller where DbContext is available
        // keep placeholders here for potential future use

            if (generoList.Count > 0)
            {
                query = query.Where(x => x.Genero != null && generoList.Contains(x.Genero.ToLower()));
        }

        if (anoList.Count > 0)
        {
            query = query.Where(x => x.PublicationYear != null && anoList.Contains(x.PublicationYear.Value));
        }

        // Filter products that have a discount: either a positive promotional price or a discount percentage
        if (hasDiscount.HasValue && hasDiscount.Value)
        {
            query = query.Where(x => (x.PromotionalPrice.HasValue && x.PromotionalPrice.Value > 0) || (x.DiscountPercentage.HasValue && x.DiscountPercentage.Value > 0));
        }

        // category and campaign filtering are handled in the controller where the DbContext
        // is available to build translatable queries that avoid materializing collection
        // navigations. This extension focuses on simple scalar filters (generos, anos).

        return query;
    }
}
