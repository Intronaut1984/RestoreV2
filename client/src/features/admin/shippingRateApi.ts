import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '../../app/api/baseApi';

export interface ShippingRateDto {
    rate: number;
    updatedAt: string;
}

export const shippingRateApi = createApi({
    reducerPath: 'shippingRateApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['ShippingRate'],
    endpoints: (builder) => ({
        getShippingRate: builder.query<ShippingRateDto, void>({
            query: () => 'shippingrate',
            providesTags: ['ShippingRate']
        }),
        updateShippingRate: builder.mutation<void, ShippingRateDto>({
            query: (data) => ({
                url: 'shippingrate',
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ['ShippingRate']
        })
    })
});

export const { useGetShippingRateQuery, useUpdateShippingRateMutation } = shippingRateApi;
