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
        CreateMap<Contact, ContactDto>();
        CreateMap<ContactDto, Contact>();

        CreateMap<CreateProductDto, Product>()
            .ForMember(dest => dest.Genero, opt => opt.MapFrom(src => src.Genero))
            .ForMember(dest => dest.Dimensoes, opt => opt.MapFrom(src => src.Dimensoes))
            .ForMember(dest => dest.Cor, opt => opt.MapFrom(src => src.Cor))
            .ForMember(dest => dest.Material, opt => opt.MapFrom(src => src.Material))
            .ForMember(dest => dest.Tamanho, opt => opt.MapFrom(src => src.Tamanho))
            .ForMember(dest => dest.Marca, opt => opt.MapFrom(src => src.Marca));

        CreateMap<UpdateProductDto, Product>()
            .ForMember(dest => dest.Genero, opt => opt.MapFrom(src => src.Genero))
            .ForMember(dest => dest.Dimensoes, opt => opt.MapFrom(src => src.Dimensoes))
            .ForMember(dest => dest.Cor, opt => opt.MapFrom(src => src.Cor))
            .ForMember(dest => dest.Material, opt => opt.MapFrom(src => src.Material))
            .ForMember(dest => dest.Tamanho, opt => opt.MapFrom(src => src.Tamanho))
            .ForMember(dest => dest.Marca, opt => opt.MapFrom(src => src.Marca));
    }

    // no ParseGenero needed anymore since Genero is stored as free-form string
}