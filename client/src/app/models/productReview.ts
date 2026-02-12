export type ProductReview = {
  id: number;
  productId: number;
  orderId: number;
  buyerEmail: string;
  rating: number;
  comment: string;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  createdAt: string;
};
