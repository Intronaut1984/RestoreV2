import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";

export interface LogoDto {
    url?: string;
    file?: File;
}

export const logoApi = createApi({
    reducerPath: 'logoApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Logo'],
    endpoints: (builder) => ({
        getLogo: builder.query<{ url: string }, void>({
            query: () => 'logo',
            providesTags: ['Logo']
        }),
        updateLogo: builder.mutation<void, FormData>({
            query: (formData) => ({
                url: 'logo',
                method: 'PUT',
                body: formData
            }),
            invalidatesTags: ['Logo']
        })
    })
});

export const { useGetLogoQuery, useUpdateLogoMutation } = logoApi;

