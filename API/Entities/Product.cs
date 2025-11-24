using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace API.Entities;

public enum Genero
{
    Ficcao,
    NaoFiccao,
    Fantasia,
    FiccaoCientifica,
    Misterio,
    Thriller,
    Terror,
    Romance,
    Historico,
    Juvenil,
    Infantil,
    Biografia,
    Autobiografia,
    Poesia,
    AutoAjuda,
    Negocios,
    Ciencias,
    Filosofia,
    Religiao,
    Arte,
    Culinaria,
    Viagens,
    Saude,
    Educacao,
    BandaDesenhada,
    NovelaGrafica,
    Manga,
    Drama,
    Classico,
    Crime
}

[Owned]
public class Dimensions
{
    [JsonPropertyName("altura")]
    public int? Altura { get; set; }

    [JsonPropertyName("largura")]
    public int? Largura { get; set; }

    [JsonPropertyName("espessura")]
    public int? Espessura { get; set; }
}

public class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Subtitle { get; set; }

    public string? Author { get; set; }

    public List<string>? SecondaryAuthors { get; set; }

    public string? ISBN { get; set; }

    public string? Publisher { get; set; }

    public int? Edition { get; set; }

    [JsonPropertyName("anoPublicacao")]
    public int? PublicationYear { get; set; }

    public Genero? Genero { get; set; }

    public decimal Price { get; set; }

    public decimal? PromotionalPrice { get; set; }

    public int? DiscountPercentage { get; set; }

    public int QuantityInStock { get; set; }

    public string? Synopsis { get; set; }

    public string? Index { get; set; }

    public int? PageCount { get; set; }

    public string? Language { get; set; }

    public string? Format { get; set; }

    public Dimensions? Dimensoes { get; set; }

    public int? Weight { get; set; }

    public string? PictureUrl { get; set; }

    public List<string>? SecondaryImages { get; set; }

    public List<string>? Tags { get; set; }

    public double? AverageRating { get; set; }

    public int? RatingsCount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool Active { get; set; } = true;

    public string? PublicId { get; set; }
}