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
        if (Enum.TryParse<Genero>(genero, true, out var g)) return g;
        return null;
    }
}