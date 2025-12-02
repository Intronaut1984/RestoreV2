import { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { PaymentSummary, ShippingAddress } from "../app/models/order"

export function currencyFormat(amount: number) {
    return '€' + (amount / 100).toFixed(2)
}

// Format order amounts defensively: API should return cents, but legacy orders
// may be double-scaled or stored in euros. If the value is implausibly large
// (greater than €1,000 in cents -> 100000), assume it's accidentally scaled
// by 100 and divide once more.
export function formatOrderAmount(amount: number) {
    if (amount === null || amount === undefined) return currencyFormat(0);
    // if amount is huge (e.g. > 1000 euros expressed in cents), try to correct
    if (Math.abs(amount) > 100000) {
        return currencyFormat(Math.round(amount / 100));
    }
    return currencyFormat(amount);
}

export function computeFinalPrice(price: number, discountPercentage?: number | null, promotionalPrice?: number | null) {
    // price and promotionalPrice are expected in cents
    if (promotionalPrice !== undefined && promotionalPrice !== null) return promotionalPrice;
    if (discountPercentage !== undefined && discountPercentage !== null) {
        const d = Math.max(0, Math.min(100, Number(discountPercentage)));
        return Math.round(price * (1 - d / 100));
    }
    return price;
}

export function filterEmptyValues(values: object) {
    return Object.fromEntries(
        Object.entries(values).filter(
            ([, value]) => value !== '' && value !== null
                && value !== undefined && value.length !== 0
        )
    )
}

export const formatAddressString = (address: ShippingAddress) => {
    return `${address?.name}, ${address?.line1}, ${address?.city}, ${address?.state}, 
            ${address?.postal_code}, ${address?.country}`
}

export const formatPaymentString = (card: PaymentSummary) => {
    return `${card?.brand?.toUpperCase()}, **** **** **** ${card?.last4}, 
            Exp: ${card?.exp_month}/${card?.exp_year}`
}

export function handleApiError<T extends FieldValues>(
    error: unknown,
    setError: UseFormSetError<T>,
    fieldNames: Path<T>[]
) {
    const apiError = (error as {message: string}) || {};

    if (apiError.message && typeof apiError.message === 'string') {
        const errorArray = apiError.message.split(',');

        errorArray.forEach(e => {
            const matchedField = fieldNames.find(fieldName => 
                e.toLowerCase().includes(fieldName.toString().toLowerCase()));
            
            if (matchedField) setError(matchedField, {message: e.trim()});
        })
    }
}