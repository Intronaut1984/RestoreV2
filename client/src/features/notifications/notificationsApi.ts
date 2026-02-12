import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import type { UserNotification } from "../../app/models/userNotification";

export const notificationsApi = createApi({
    reducerPath: 'notificationsApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Notifications'],
    endpoints: (builder) => ({
        getNotifications: builder.query<UserNotification[], number | void>({
            query: (take) => `notifications?take=${take ?? 20}`,
            providesTags: ['Notifications']
        }),
        getUnreadCount: builder.query<number, void>({
            query: () => 'notifications/unread-count',
            providesTags: ['Notifications']
        }),
        markRead: builder.mutation<void, number>({
            query: (id) => ({
                url: `notifications/${id}/read`,
                method: 'POST'
            }),
            invalidatesTags: ['Notifications']
        }),
        markAllRead: builder.mutation<void, void>({
            query: () => ({
                url: 'notifications/mark-all-read',
                method: 'POST'
            }),
            invalidatesTags: ['Notifications']
        })
    })
});

export const { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkReadMutation, useMarkAllReadMutation } = notificationsApi;
