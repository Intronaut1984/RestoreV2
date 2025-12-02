import { createSlice } from "@reduxjs/toolkit";
import { ProductParams } from "../../app/models/productParams";

const initialState: ProductParams = {
    pageNumber: 1,
    pageSize: 8,
    anos: [],
    generos: [],
    categoryIds: [],
    campaignIds: [],
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
export const { setCategories, setCampaigns, setHasDiscount } = catalogSlice.actions;