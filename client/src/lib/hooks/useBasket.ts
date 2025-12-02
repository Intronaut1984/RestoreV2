import { Item } from "../../app/models/basket";
import { useClearBasketMutation, useFetchBasketQuery } from "../../features/basket/basketApi";
import { computeFinalPrice } from "../util";

export const useBasket = () => {
    const {data: basket} = useFetchBasketQuery();
    const [clearBasket] = useClearBasketMutation();

    // subtotal before product-level discounts
    const subtotal = basket?.items.reduce((sum: number, item: Item) => sum + item.quantity * item.price, 0) ?? 0;
    const deliveryFee = subtotal > 10000 ? 0 : 500;

    // product-level discounts (sum of original - discounted price for each item)
    const productDiscount = basket?.items.reduce((sum: number, item: Item) => {
        const finalPrice = computeFinalPrice(item.price, item.discountPercentage ?? undefined);
        return sum + item.quantity * Math.max(0, item.price - finalPrice);
    }, 0) ?? 0;

    let couponDiscount = 0;

    if (basket?.coupon) {
        if (basket.coupon.amountOff) {
            // amountOff is expected in cents
            couponDiscount = basket.coupon.amountOff;
        } else if (basket.coupon.percentOff) {
            couponDiscount = Math.round(subtotal * (basket.coupon.percentOff / 100));
        }
    }

    const discount = productDiscount + couponDiscount;

    const total = subtotal - discount + deliveryFee;

    return {basket, subtotal, deliveryFee, productDiscount, couponDiscount, discount, total, clearBasket}
}