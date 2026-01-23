import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import { Product } from "../../app/models/product";

export const favoritesApi = createApi({
    reducerPath: 'favoritesApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Favorites','Products'],
    endpoints: (builder) => ({
        fetchFavorites: builder.query<Product[], void>({
            query: () => 'favorites',
            providesTags: (result) => result ?
                [
                    ...result.map(p => ({ type: 'Favorites' as const, id: p.id })),
                    { type: 'Favorites', id: 'LIST' }
                ] : [{ type: 'Favorites', id: 'LIST' }]
        }),
        addFavorite: builder.mutation<void, number>({
            query: (productId) => ({ url: `favorites/${productId}`, method: 'POST' }),
            invalidatesTags: [{ type: 'Favorites', id: 'LIST' }, { type: 'Products', id: 'LIST' }]
        }),
        removeFavorite: builder.mutation<void, number>({
            query: (productId) => ({ url: `favorites/${productId}`, method: 'DELETE' }),
            invalidatesTags: [{ type: 'Favorites', id: 'LIST' }, { type: 'Products', id: 'LIST' }]
        })
    })
});

export const { useFetchFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } = favoritesApi;
