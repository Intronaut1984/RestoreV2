using System;
using API.DTOs;
using API.Entities;
using AutoMapper;

namespace API.RequestHelpers;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<DimensionsDto, Dimensions>();

        CreateMap<CreateProductDto, Product>()
            .ForMember(dest => dest.Genero, opt => opt.MapFrom(src => ParseGenero(src.Genero)))
            .ForMember(dest => dest.Dimensoes, opt => opt.MapFrom(src => src.Dimensoes));

        CreateMap<UpdateProductDto, Product>()
            .ForMember(dest => dest.Genero, opt => opt.MapFrom(src => ParseGenero(src.Genero)))
            .ForMember(dest => dest.Dimensoes, opt => opt.MapFrom(src => src.Dimensoes));
    }

    private static Genero? ParseGenero(string? genero)
    {
        if (string.IsNullOrEmpty(genero)) return null;

        // Normalize by removing diacritics and spaces so Portuguese values like "Ciências" match enum "Ciencias"
        var normalized = RemoveDiacritics(genero).Replace(" ", "");

        if (Enum.TryParse<Genero>(normalized, true, out var g)) return g;

        // fallback: try parse original value (case-insensitive)
        if (Enum.TryParse<Genero>(genero, true, out g)) return g;

        return null;
    }

    private static string RemoveDiacritics(string text)
    {
        var formD = text.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var ch in formD)
        {
            var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
            if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(ch);
            }
        }
        return sb.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}