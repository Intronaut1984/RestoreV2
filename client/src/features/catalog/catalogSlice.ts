import { createSlice } from "@reduxjs/toolkit";
import { ProductParams } from "../../app/models/productParams";

const initialState: ProductParams = {
    pageNumber: 1,
    pageSize: 8,
    anos: [],
    generos: [],
    categoryIds: [],
    campaignIds: [],
    marcas: [],
    modelos: [],
    tipos: [],
    capacidades: [],
    cores: [],
    materiais: [],
    tamanhos: [],
    hasDiscount: undefined,
    searchTerm: '',
    orderBy: 'name'
}

export const catalogSlice = createSlice({
    name: 'catalogSlice',
    initialState,
    reducers: {
        setPageNumber(state, action) {
            state.pageNumber = action.payload
        },
        setPageSize(state, action) {
            state.pageSize = action.payload
        },
        setOrderBy(state, action) {
            state.orderBy = action.payload
            state.pageNumber = 1;
        },
        setAnos(state, action) {
            state.anos = action.payload
            state.pageNumber = 1;
        },
        setGeneros(state, action) {
            state.generos = action.payload
            state.pageNumber = 1;
        },
        setCategories(state, action) {
            state.categoryIds = action.payload
            state.pageNumber = 1;
        },
        setCampaigns(state, action) {
            state.campaignIds = action.payload
            state.pageNumber = 1;
        },
        setMarcas(state, action) {
            state.marcas = action.payload
            state.pageNumber = 1;
        },
        setModelos(state, action) {
            state.modelos = action.payload
            state.pageNumber = 1;
        },
        setTipos(state, action) {
            state.tipos = action.payload
            state.pageNumber = 1;
        },
        setCapacidades(state, action) {
            state.capacidades = action.payload
            state.pageNumber = 1;
        },
        setCores(state, action) {
            state.cores = action.payload
            state.pageNumber = 1;
        },
        setMateriais(state, action) {
            state.materiais = action.payload
            state.pageNumber = 1;
        },
        setTamanhos(state, action) {
            state.tamanhos = action.payload
            state.pageNumber = 1;
        },
        setHasDiscount(state, action) {
            state.hasDiscount = action.payload;
            state.pageNumber = 1;
        },
        setSearchTerm(state, action) {
            state.searchTerm = action.payload
            state.pageNumber = 1;
        },
        resetParams() {
            return initialState;
        }
    }
});

export const { setOrderBy, setPageNumber, setPageSize, 
    setSearchTerm, setAnos, setGeneros, resetParams } 
    = catalogSlice.actions;
export const { setCategories, setCampaigns, setHasDiscount, setMarcas, setModelos, setTipos, setCapacidades, setCores, setMateriais, setTamanhos } = catalogSlice.actions;