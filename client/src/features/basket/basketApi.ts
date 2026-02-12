import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import { Basket, Item } from "../../app/models/basket";
import { Product } from "../../app/models/product";
import Cookies from 'js-cookie';
import { toast } from "react-toastify";

function isBasketItem(product: Product | Item): product is Item {
    return (product as Item).quantity !== undefined;
}

export const basketApi = createApi({
    reducerPath: 'basketApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Basket'],
    endpoints: (builder) => ({
        fetchBasket: builder.query<Basket, void>({
            query: () => 'basket',
            providesTags: ['Basket']
        }),
        addBasketItem: builder.mutation<Basket, { product: Product | Item; quantity: number; variantId?: number | null }>({
            query: ({ product, quantity, variantId }) => {
                const productId = isBasketItem(product) ? product.productId : product.id;
                const variantPart = variantId ? `&variantId=${variantId}` : '';
                return {
                    url: `basket?productId=${productId}&quantity=${quantity}${variantPart}`,
                    method: 'POST'
                }
            },
            onQueryStarted: async ({ product, quantity, variantId }, { dispatch, queryFulfilled }) => {
                let isNewBasket = false;
                const productName = product.name;
                const patchResult = dispatch(
                    basketApi.util.updateQueryData('fetchBasket', undefined, (draft) => {
                        const productId = isBasketItem(product) ? product.productId : product.id;
                        const resolvedVariantId = isBasketItem(product)
                            ? (product.productVariantId ?? null)
                            : (variantId ?? null);

                        if (!draft?.basketId) isNewBasket = true;

                        if (!isNewBasket) {
                            const existingItem = draft.items.find(item => item.productId === productId && (item.productVariantId ?? null) === resolvedVariantId);
                            if (existingItem) existingItem.quantity += quantity;
                            else {
                                if (isBasketItem(product)) {
                                    draft.items.push(product);
                                } else {
                                    const selectedVariant = (product.variants ?? []).find(v => v.id === resolvedVariantId);
                                    const resolvedPrice = (selectedVariant?.priceOverride ?? null) ?? product.price;
                                    const resolvedPictureUrl = (selectedVariant?.pictureUrl ?? null) ?? product.pictureUrl;

                                    // Explicitly construct the optimistic Item including discountPercentage
                                    const newItem: Item = {
                                        productId: product.id,
                                        productVariantId: resolvedVariantId,
                                        variantColor: selectedVariant?.color ?? product.cor ?? null,
                                        name: product.name,
                                        price: resolvedPrice,
                                        pictureUrl: resolvedPictureUrl,
                                        genero: product.genero,
                                        anoPublicacao: product.anoPublicacao,
                                        quantity,
                                        discountPercentage: product.discountPercentage ?? null
                                    };

                                    draft.items.push(newItem);
                                }
                            }
                        }
                    })
                )

                try {
                    await queryFulfilled;

                    if (isNewBasket) dispatch(basketApi.util.invalidateTags(['Basket']))

                    // Green banner confirmation
                    const qtyLabel = quantity > 1 ? ` (x${quantity})` : '';
                    toast.success(`${productName} adicionado ao carrinho${qtyLabel}`);
                } catch (error) {
                    console.log(error);
                    patchResult.undo();
                }
            }
        }),
        removeBasketItem: builder.mutation<void, { productId: number; quantity: number; variantId?: number | null }>({
            query: ({ productId, quantity, variantId }) => {
                const variantPart = variantId ? `&variantId=${variantId}` : '';
                return {
                    url: `basket?productId=${productId}&quantity=${quantity}${variantPart}`,
                    method: 'DELETE'
                };
            },
            onQueryStarted: async ({ productId, quantity, variantId }, { dispatch, queryFulfilled }) => {
                const patchResult = dispatch(
                    basketApi.util.updateQueryData('fetchBasket', undefined, (draft) => {
                        const itemIndex = draft.items.findIndex(item => item.productId === productId && (item.productVariantId ?? null) === (variantId ?? null));
                        if (itemIndex >= 0) {
                            draft.items[itemIndex].quantity -= quantity;
                            if (draft.items[itemIndex].quantity <= 0) {
                                draft.items.splice(itemIndex, 1);
                            }
                        }
                    })
                )

                try {
                    await queryFulfilled;
                } catch (error) {
                    console.log(error);
                    patchResult.undo();
                }
            }
        }),
        clearBasket: builder.mutation<void, void>({
            queryFn: () => ({data: undefined}),
            onQueryStarted: async (_, {dispatch}) => {
                dispatch(
                    basketApi.util.updateQueryData('fetchBasket', undefined, (draft) => {
                        draft.items = [];
                        draft.basketId = '';
                    })
                );
                Cookies.remove('basketId');
            }
        }),
        addCoupon: builder.mutation<Basket, string>({
            query: (code: string) => ({
                url: `basket/${code}`,
                method: 'POST'
            }),
            onQueryStarted: async (_, {dispatch, queryFulfilled}) => {
                const {data: updatedBasket} = await queryFulfilled;

                dispatch(basketApi.util.updateQueryData('fetchBasket', undefined, (draft)=> {
                    Object.assign(draft, updatedBasket)
                }))
            } 
        }),
        removeCoupon: builder.mutation<Basket, void>({
            query: () => ({
                url: 'basket/remove-coupon',
                method: 'DELETE'
            }),
            onQueryStarted: async (_, {dispatch, queryFulfilled}) => {
                await queryFulfilled;

                dispatch(basketApi.util.updateQueryData('fetchBasket', undefined, (draft)=> {
                    draft.coupon = null
                }))
            } 
        })
    })
});

export const { useFetchBasketQuery, useAddBasketItemMutation, 
    useAddCouponMutation, useRemoveCouponMutation,
    useRemoveBasketItemMutation, useClearBasketMutation } = basketApi;