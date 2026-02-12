import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import { CreateOrder, Order } from "../../app/models/order";
import { Pagination } from "../../app/models/pagination";
import type { OrderIncident } from "../../app/models/orderIncident";

type OrderTag = { type: 'Orders'; id: number | 'LIST' };
type IncidentTag = { type: 'Incidents'; id: number | 'LIST' };

export type AdminSalesQuery = {
    pageNumber: number;
    pageSize: number;
    from?: string;
    to?: string;
    status?: string;
    buyerEmail?: string;
    categoryId?: number;
};

export const orderApi = createApi({
    reducerPath: 'orderApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Orders', 'Incidents'],
    endpoints: (builder) => ({
        fetchOrders: builder.query<Order[], void>({
            query: () => 'orders',
            providesTags: (): OrderTag[] => [{ type: 'Orders', id: 'LIST' }]
        }),
        fetchAllSales: builder.query<{ items: Order[]; pagination: Pagination }, AdminSalesQuery>({
            query: (q) => ({
                url: 'orders/all',
                params: {
                    pageNumber: q.pageNumber,
                    pageSize: q.pageSize,
                    from: q.from,
                    to: q.to,
                    status: q.status,
                    buyerEmail: q.buyerEmail,
                    categoryId: q.categoryId
                }
            }),
            providesTags: (): OrderTag[] => [{ type: 'Orders', id: 'LIST' }],
            transformResponse: (items: Order[], meta) => {
                const paginationHeader = meta?.response?.headers.get('Pagination');
                const pagination = paginationHeader ? JSON.parse(paginationHeader) : null;
                return { items, pagination };
            }
        }),
        fetchOrderDetailed: builder.query<Order, number>({
            query: (id) => ({
                url: `orders/${id}`
            }),
            providesTags: (_result, _error, id): OrderTag[] => [{ type: 'Orders', id }]
        }),
        fetchAnyOrderDetailed: builder.query<Order, number>({
            query: (id) => ({
                url: `orders/all/${id}`
            }),
            providesTags: (_result, _error, id): OrderTag[] => [{ type: 'Orders', id }]
        }),
        updateAnyOrderStatus: builder.mutation<Order, { id: number; status: string }>({
            query: ({ id, status }) => ({
                url: `orders/all/${id}/status`,
                method: 'PUT',
                body: { status }
            }),
            invalidatesTags: (_result, _error, { id }): OrderTag[] => [
                { type: 'Orders', id },
                { type: 'Orders', id: 'LIST' }
            ]
        }),
        updateAnyOrderTracking: builder.mutation<Order, { id: number; trackingNumber: string }>({
            query: ({ id, trackingNumber }) => ({
                url: `orders/all/${id}/tracking`,
                method: 'PUT',
                body: { trackingNumber }
            }),
            invalidatesTags: (_result, _error, { id }): OrderTag[] => [
                { type: 'Orders', id },
                { type: 'Orders', id: 'LIST' }
            ]
        }),
        addOrderComment: builder.mutation<void, { id: number; comment: string }>({
            query: ({ id, comment }) => ({
                url: `orders/${id}/comment`,
                method: 'POST',
                body: { comment }
            }),
            invalidatesTags: (_result, _error, { id }): OrderTag[] => [
                { type: 'Orders', id },
                { type: 'Orders', id: 'LIST' }
            ]
        }),
        fetchOrderIncident: builder.query<OrderIncident, number>({
            query: (id) => ({
                url: `orders/${id}/incident`
            }),
            providesTags: (_result, _error, id): IncidentTag[] => [{ type: 'Incidents', id }]
        }),
        openOrderIncident: builder.mutation<void, { id: number; productId?: number | null; description: string; files: File[] }>({
            query: ({ id, productId, description, files }) => {
                const form = new FormData();
                form.append('description', description);
                if (productId) form.append('productId', String(productId));
                for (const f of files) form.append('files', f);
                return {
                    url: `orders/${id}/incident/open`,
                    method: 'POST',
                    body: form
                };
            },
            invalidatesTags: (_result, _error, { id }): (OrderTag | IncidentTag)[] => [
                { type: 'Incidents', id },
                { type: 'Orders', id },
                { type: 'Orders', id: 'LIST' }
            ]
        }),
        resolveOrderIncident: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `orders/${id}/incident/resolve`,
                method: 'PUT'
            }),
            invalidatesTags: (_result, _error, { id }): (OrderTag | IncidentTag)[] => [
                { type: 'Incidents', id },
                { type: 'Orders', id },
                { type: 'Orders', id: 'LIST' }
            ]
        }),
        replyOrderIncident: builder.mutation<void, { id: number; reply: string }>({
            query: ({ id, reply }) => ({
                url: `orders/${id}/incident/reply`,
                method: 'PUT',
                body: { reply }
            }),
            invalidatesTags: (_result, _error, { id }): (OrderTag | IncidentTag)[] => [
                { type: 'Incidents', id },
                { type: 'Orders', id },
                { type: 'Orders', id: 'LIST' }
            ]
        }),
        replyOrderComment: builder.mutation<Order, { id: number; reply: string }>({
            query: ({ id, reply }) => ({
                url: `orders/all/${id}/comment/reply`,
                method: 'PUT',
                body: { reply }
            }),
            invalidatesTags: (_result, _error, { id }): OrderTag[] => [
                { type: 'Orders', id },
                { type: 'Orders', id: 'LIST' }
            ]
        }),
        createOrder: builder.mutation<Order, CreateOrder>({
            query: (order) => ({
                url: 'orders',
                method: 'POST',
                body: order
            }),
            onQueryStarted: async (_, {dispatch, queryFulfilled}) => {
                await queryFulfilled;
                dispatch(orderApi.util.invalidateTags(['Orders']))
            }
        })
    })
})

export const {
    useFetchOrdersQuery,
    useFetchAllSalesQuery,
    useFetchOrderDetailedQuery,
    useFetchAnyOrderDetailedQuery,
    useUpdateAnyOrderStatusMutation,
    useUpdateAnyOrderTrackingMutation,
    useAddOrderCommentMutation,
    useFetchOrderIncidentQuery,
    useOpenOrderIncidentMutation,
    useResolveOrderIncidentMutation,
    useReplyOrderIncidentMutation,
    useReplyOrderCommentMutation,
    useCreateOrderMutation
} 
    = orderApi;