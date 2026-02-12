export type IncidentStatus = 'None' | 'Open' | 'Resolved';

export type OrderIncidentAttachment = {
  id: number;
  originalFileName: string;
  contentType: string;
  size: number;
  createdAt: string;
};

export type OrderIncident = {
  id?: number | null;
  orderId: number;
  buyerEmail: string;
  status: IncidentStatus;
  productId?: number | null;
  description?: string | null;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
  attachments: OrderIncidentAttachment[];
};
