import { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { PaymentSummary, ShippingAddress } from "../app/models/order"

export function currencyFormat(amount: number) {
    return '€' + (amount / 100).toFixed(2)
}

export function formatOrderAmount(amount: number) {
    if (amount === null || amount === undefined) return currencyFormat(0);
    // All monetary values are expected to be in cents.
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

export function emailToUsername(email: string | null | undefined) {
    if (!email) return '-';
    const at = email.indexOf('@');
    if (at <= 0) return email;
    return email.slice(0, at);
}