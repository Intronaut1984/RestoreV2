import { createApi } from "@reduxjs/toolkit/query/react";
import { Product } from "../../app/models/product";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import { ProductParams } from "../../app/models/productParams";
import { filterEmptyValues } from "../../lib/util";
import { Pagination } from "../../app/models/pagination";

export const catalogApi = createApi({
    reducerPath: 'catalogApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Products','Filters'],
    endpoints: (builder) => ({
        fetchProducts: builder.query<{items: Product[], pagination: Pagination}, ProductParams>({
            query: (productParams) => {
                // backend expects comma-separated strings for generos and anos
                const params: Record<string, string | number | undefined> = {
                    orderBy: productParams.orderBy,
                    pageNumber: productParams.pageNumber,
                    pageSize: productParams.pageSize,
                    searchTerm: productParams.searchTerm
                };

                if (productParams.generos && productParams.generos.length > 0) {
                    params.generos = productParams.generos.map(g => g.toLowerCase()).join(',');
                }

                if (productParams.anos && productParams.anos.length > 0) {
                    params.anos = productParams.anos.join(',');
                }

                if (productParams.categoryIds && productParams.categoryIds.length > 0) {
                    params.categoryIds = productParams.categoryIds.join(',');
                }

                if (productParams.campaignIds && productParams.campaignIds.length > 0) {
                    params.campaignIds = productParams.campaignIds.join(',');
                }

                if (productParams.hasDiscount !== undefined) {
                    params.hasDiscount = productParams.hasDiscount ? 'true' : 'false';
                }

                return {
                    url: 'products',
                    params: filterEmptyValues(params)
                }
                },
            providesTags: (result) =>
            {
                // provide a Products list tag so mutations can invalidate
                return result?.items ? [
                    ...result.items.map(({ id }) => ({ type: 'Products' as const, id })),
                    { type: 'Products', id: 'LIST' }
                ] : [{ type: 'Products', id: 'LIST' }]
            },
            transformResponse: (items: Product[], meta) => {
                const paginationHeader = meta?.response?.headers.get('Pagination');
                const pagination = paginationHeader ? JSON.parse(paginationHeader) : null;
                return {items, pagination}
            }
        }),
        fetchProductDetails: builder.query<Product, number>({
            query: (productId) => `products/${productId}`
        ,
            providesTags: (_result, _error, id) => [{ type: 'Products', id }]
        }),
        fetchFilters: builder.query<{ generos: string[], anos: number[], categories?: { id: number; name: string; slug?: string; isActive?: boolean }[], campaigns?: { id: number; name: string; slug?: string; isActive?: boolean }[] }, void>({
            query: () => 'products/filters'
        ,
            providesTags: ['Filters']
        })
    })
});

export const { useFetchProductDetailsQuery, useFetchProductsQuery, useFetchFiltersQuery } 
    = catalogApi;