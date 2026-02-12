import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import { CreateOrder, Order } from "../../app/models/order";
import { Pagination } from "../../app/models/pagination";

type OrderTag = { type: 'Orders'; id: number | 'LIST' };

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
    tagTypes: ['Orders'],
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
    useAddOrderCommentMutation,
    useCreateOrderMutation
} 
    = orderApi;