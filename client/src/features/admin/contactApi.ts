import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";

export interface ContactDto {
    id: number;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    whatsappNumber?: string;
    companyName?: string;
    taxId?: string;
    updatedAt: string;
}

export const contactApi = createApi({
    reducerPath: 'contactApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Contact'],
    endpoints: (builder) => ({
        getContact: builder.query<ContactDto, void>({
            query: () => 'contact',
            providesTags: ['Contact'],
        }),
        updateContact: builder.mutation<void, ContactDto>({
            query: (contact) => ({
                url: 'contact',
                method: 'PUT',
                body: contact,
            }),
            invalidatesTags: ['Contact'],
        }),
    }),
});

export const { useGetContactQuery, useUpdateContactMutation } = contactApi;
