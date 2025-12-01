import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";

export const heroBlocksApi = createApi({
    reducerPath: 'heroBlocksApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['HeroBlocks'],
    endpoints: (builder) => ({
        getHeroBlocks: builder.query<any[], void>({
            query: () => ({ url: 'heroblocks' }),
            providesTags: ['HeroBlocks']
        }),
        createHeroBlock: builder.mutation<any, Partial<any>>({
            query: (data) => ({ url: 'heroblocks', method: 'POST', body: data }),
            invalidatesTags: ['HeroBlocks']
        }),
        updateHeroBlock: builder.mutation<void, {id:number, data: Partial<any>}>({
            query: ({id, data}) => ({ url: `heroblocks/${id}`, method: 'PUT', body: data }),
            invalidatesTags: ['HeroBlocks']
        }),
        deleteHeroBlock: builder.mutation<void, number>({
            query: (id) => ({ url: `heroblocks/${id}`, method: 'DELETE' }),
            invalidatesTags: ['HeroBlocks']
        }),
        uploadHeroImage: builder.mutation<any, {id:number, file: File}>({
            query: ({id, file}) => {
                const fd = new FormData();
                fd.append('file', file);
                return { url: `heroblocks/${id}/images`, method: 'POST', body: fd };
            },
            invalidatesTags: ['HeroBlocks']
        })
        ,
        deleteHeroImage: builder.mutation<void, {blockId:number, imageId:number}>({
            query: ({blockId, imageId}) => ({ url: `heroblocks/${blockId}/images/${imageId}`, method: 'DELETE' }),
            invalidatesTags: ['HeroBlocks']
        })
    })
});

export const {
    useGetHeroBlocksQuery,
    useCreateHeroBlockMutation,
    useUpdateHeroBlockMutation,
    useDeleteHeroBlockMutation,
    useUploadHeroImageMutation,
    useDeleteHeroImageMutation
} = heroBlocksApi;
