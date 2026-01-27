using System;
using API.Entities;

namespace API.Extensions;

public static class ProductExtensions
{
    public static IQueryable<Product> Sort(this IQueryable<Product> query, string? orderBy)
    {
        if (string.IsNullOrEmpty(orderBy)) return query.OrderBy(x => x.Name);

        if (orderBy == "salesDesc")
        {
            return query.OrderByDescending(x => x.SalesCount)
                        .ThenBy(x => x.Name);
        }

        if (orderBy == "sales")
        {
            return query.OrderBy(x => x.SalesCount)
                        .ThenBy(x => x.Name);
        }

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
        string? generos,
        string? anos,
        bool? hasDiscount = null,
        string? marcas = null,
        string? modelos = null,
        string? tipos = null,
        string? capacidades = null,
        string? cores = null,
        string? materiais = null,
        string? tamanhos = null)
    {
        var generoList = new List<string>();
        var anoList = new List<int>();
        var marcaList = new List<string>();
        var modeloList = new List<string>();
        var tipoList = new List<string>();
        var capacidadeList = new List<string>();
        var corList = new List<string>();
        var materialList = new List<string>();
        var tamanhoList = new List<string>();

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

        if (!string.IsNullOrEmpty(marcas))
        {
            marcaList.AddRange(marcas.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        }

        if (!string.IsNullOrEmpty(modelos))
        {
            modeloList.AddRange(modelos.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        }

        if (!string.IsNullOrEmpty(tipos))
        {
            tipoList.AddRange(tipos.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        }

        if (!string.IsNullOrEmpty(capacidades))
        {
            capacidadeList.AddRange(capacidades.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        }

        if (!string.IsNullOrEmpty(cores))
        {
            corList.AddRange(cores.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        }

        if (!string.IsNullOrEmpty(materiais))
        {
            materialList.AddRange(materiais.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        }

        if (!string.IsNullOrEmpty(tamanhos))
        {
            tamanhoList.AddRange(tamanhos.ToLower().Split(",", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
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

        if (marcaList.Count > 0)
        {
            query = query.Where(x => x.Marca != null && marcaList.Contains(x.Marca.ToLower()));
        }

        if (modeloList.Count > 0)
        {
            query = query.Where(x => x.Modelo != null && modeloList.Contains(x.Modelo.ToLower()));
        }

        if (tipoList.Count > 0)
        {
            query = query.Where(x => x.Tipo != null && tipoList.Contains(x.Tipo.ToLower()));
        }

        if (capacidadeList.Count > 0)
        {
            query = query.Where(x => x.Capacidade != null && capacidadeList.Contains(x.Capacidade.ToLower()));
        }

        if (corList.Count > 0)
        {
            query = query.Where(x => x.Cor != null && corList.Contains(x.Cor.ToLower()));
        }

        if (materialList.Count > 0)
        {
            query = query.Where(x => x.Material != null && materialList.Contains(x.Material.ToLower()));
        }

        if (tamanhoList.Count > 0)
        {
            query = query.Where(x => x.Tamanho != null && tamanhoList.Contains(x.Tamanho.ToLower()));
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
