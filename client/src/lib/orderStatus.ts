export type OrderStatusOption = {
  value: string;
  label: string;
};

const statusLabels: Record<string, string> = {
  Pending: "Pagamento pendente",
  PaymentReceived: "A aguardar",
  PaymentMismatch: "Pagamento incorreto",
  PaymentFailed: "Pagamento falhado",
  Processing: "Em processamento",
  Processed: "Processado",
  Shipped: "Enviado",
  Delivered: "Entregue",
  Cancelled: "Cancelado",
  ReviewRequested: "Para avaliação",
};

export function getOrderStatusLabel(status: string | null | undefined) {
  if (!status) return "-";
  return statusLabels[status] ?? status;
}

export const adminOrderStatusOptions: OrderStatusOption[] = [
  { value: "PaymentReceived", label: statusLabels.PaymentReceived },
  { value: "Processing", label: statusLabels.Processing },
  { value: "Processed", label: statusLabels.Processed },
  { value: "Shipped", label: statusLabels.Shipped },
  { value: "Delivered", label: statusLabels.Delivered },
  { value: "Cancelled", label: statusLabels.Cancelled },
  { value: "ReviewRequested", label: statusLabels.ReviewRequested },
];
