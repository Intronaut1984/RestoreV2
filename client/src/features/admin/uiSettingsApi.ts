import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";

export type UiSettings = {
    primaryColorLight: string;
    secondaryColorLight: string;
    primaryColorDark: string;
    secondaryColorDark: string;

    buttonIconColor: 'primary' | 'secondary' | 'inherit' | 'text';

    notificationsBadgeColorLight: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    notificationsBadgeColorDark: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export const uiSettingsApi = createApi({
    reducerPath: 'uiSettingsApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['UiSettings'],
    endpoints: (builder) => ({
        getUiSettings: builder.query<UiSettings, void>({
            query: () => ({ url: 'uiSettings' }),
            providesTags: ['UiSettings']
        }),
        updateUiSettings: builder.mutation<void, UiSettings>({
            query: (payload) => ({
                url: 'uiSettings',
                method: 'PUT',
                body: payload
            }),
            invalidatesTags: ['UiSettings']
        })
    })
});

export const { useGetUiSettingsQuery, useUpdateUiSettingsMutation } = uiSettingsApi;
