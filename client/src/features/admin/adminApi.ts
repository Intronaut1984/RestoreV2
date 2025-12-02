import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import { Product } from "../../app/models/product";
import { User } from "../../app/models/user";
import { Campaign } from "../../app/models/campaign";
import { Category } from "../../app/models/category";

export const adminApi = createApi({
    reducerPath: 'adminApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Products','Filters','Users'],
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => ({ url: 'admin/users' }),
            providesTags: ['Users']
        }),
        getPromo: builder.query<{ message: string; color: string }, void>({
            query: () => ({ url: 'admin/promo' }),
            providesTags: ['Users']
        }),
        updatePromo: builder.mutation<void, { message: string; color: string }>({
            query: (payload) => ({
                url: 'admin/promo',
                method: 'PUT',
                body: payload
            }),
            invalidatesTags: ['Users']
        }),
        updateUserRole: builder.mutation<void, { email: string; role: string }>({
            query: (payload) => ({
                url: 'admin/users/roles',
                method: 'PUT',
                body: payload
            }),
            invalidatesTags: ['Users']
        }),
        createProduct: builder.mutation<Product, FormData>({
            query: (data: FormData) => {
                return {
                    url: 'products',
                    method: 'POST',
                    body: data
                }
            }
        ,
            invalidatesTags: ['Products','Filters']
        }),
        updateProduct: builder.mutation<void, {id: number, data: FormData}>({
            query: ({id, data}) => {
                data.append('id', id.toString())

                return {
                    url: 'products',
                    method: 'PUT',
                    body: data
                }
            }
        ,
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Products', id }, { type: 'Products', id: 'LIST' }, 'Filters']
        }),
        deleteProduct: builder.mutation<void, number>({
            query: (id: number) => {
                return {
                    url: `products/${id}`,
                    method: 'DELETE'
                }
            }
        ,
            invalidatesTags: (_result, _error, id) => [{ type: 'Products', id }, { type: 'Products', id: 'LIST' }, 'Filters']
        })
        ,
        getCampaigns: builder.query<Campaign[], void>({
            query: () => ({ url: 'campaigns' }),
            providesTags: ['Filters']
        }),
        createCampaign: builder.mutation<Campaign, { name: string }>({
            query: (payload) => ({ url: 'campaigns', method: 'POST', body: payload }),
            invalidatesTags: ['Filters']
        }),
        getCategories: builder.query<Category[], void>({
            query: () => ({ url: 'categories' }),
            providesTags: ['Filters']
        })
        ,
        createCategory: builder.mutation<Category, { name: string }>({
            query: (payload) => ({ url: 'categories', method: 'POST', body: payload }),
            invalidatesTags: ['Filters']
        })
    })
});

export const {
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useGetCampaignsQuery,
    useGetCategoriesQuery,
    useCreateCampaignMutation,
    useCreateCategoryMutation,
    useGetUsersQuery,
    useGetPromoQuery,
    useUpdatePromoMutation,
    useUpdateUserRoleMutation
} = adminApi;