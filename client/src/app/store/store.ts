import { configureStore, legacy_createStore } from "@reduxjs/toolkit";
import counterReducer, { counterSlice } from "../../features/contact/counterReducer";
import { useDispatch, useSelector } from "react-redux";
import { catalogApi } from "../../features/catalog/catalogApi";
import { favoritesApi } from "../../features/catalog/favoritesApi";
import { uiSlice } from "../layout/uiSlice";
import { errorApi } from "../../features/about/errorApi";
import { basketApi } from "../../features/basket/basketApi";
import { catalogSlice } from "../../features/catalog/catalogSlice";
import { accountApi } from "../../features/account/accountApi";
import { checkoutApi } from "../../features/checkout/checkoutApi";
import { orderApi } from "../../features/orders/orderApi";
import { adminApi } from "../../features/admin/adminApi";
import { analyticsApi } from "../../features/admin/analyticsApi";
import { newslettersApi } from "../../features/admin/newslettersApi";
import { heroBlocksApi } from "../../features/admin/heroBlocksApi";
import { logoApi } from "../../features/admin/logoApi";
import { contactApi } from "../../features/admin/contactApi";
import { shippingRateApi } from "../../features/admin/shippingRateApi";

export function configureTheStore() {
    return legacy_createStore(counterReducer)
}

export const store = configureStore({
    reducer: {
        [catalogApi.reducerPath]: catalogApi.reducer,
        [favoritesApi.reducerPath]: favoritesApi.reducer,
        [errorApi.reducerPath]: errorApi.reducer,
        [basketApi.reducerPath]: basketApi.reducer,
        [accountApi.reducerPath]: accountApi.reducer,
        [checkoutApi.reducerPath]: checkoutApi.reducer,
        [orderApi.reducerPath]: orderApi.reducer,
        [adminApi.reducerPath]: adminApi.reducer,
        [analyticsApi.reducerPath]: analyticsApi.reducer,
        [newslettersApi.reducerPath]: newslettersApi.reducer,
        [heroBlocksApi.reducerPath]: heroBlocksApi.reducer,
        [logoApi.reducerPath]: logoApi.reducer,
        [contactApi.reducerPath]: contactApi.reducer,
        [shippingRateApi.reducerPath]: shippingRateApi.reducer,
        counter: counterSlice.reducer,
        ui: uiSlice.reducer,
        catalog: catalogSlice.reducer
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(
            catalogApi.middleware, 
            favoritesApi.middleware,
            errorApi.middleware,
            basketApi.middleware,
            accountApi.middleware,
            checkoutApi.middleware,
            orderApi.middleware,
            adminApi.middleware,
            analyticsApi.middleware,
            newslettersApi.middleware,
            heroBlocksApi.middleware,
            logoApi.middleware,
            contactApi.middleware,
            shippingRateApi.middleware
        )
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()