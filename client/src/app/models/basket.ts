export type Basket = {
  basketId: string
  items: Item[]
  clientSecret?: string
  paymentIntentId?: string
  coupon: Coupon | null
}

export type Item = {
  productId: number
  name: string
  price: number
  pictureUrl: string
  genero?: string
  anoPublicacao?: number
  quantity: number
  // optional discount from product (percentage, e.g. 10 for 10%)
  discountPercentage?: number | null
}

export type Coupon = {
  name: string;
  amountOff?: number;
  percentOff?: number;
  promotionCode: string;
  couponId: string;
}