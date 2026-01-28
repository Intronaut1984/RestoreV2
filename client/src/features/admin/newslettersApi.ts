import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '../../app/api/baseApi';

export type NewsletterStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Sending'
  | 'Sent'
  | 'Failed'
  | 'Cancelled';

export type NewsletterAttachment = {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAtUtc: string;
};

export type Newsletter = {
  id: number;
  subject: string;
  htmlContent: string;
  status: NewsletterStatus;
  scheduledForUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  sentAtUtc?: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  lastError?: string | null;
  attachments: NewsletterAttachment[];
};

export type CreateNewsletterDto = {
  subject: string;
  htmlContent: string;
  scheduledForUtc?: string | null;
};

export type UpdateNewsletterDto = {
  subject?: string;
  htmlContent?: string;
  status?: NewsletterStatus;
  scheduledForUtc?: string | null;
};

export const newslettersApi = createApi({
  reducerPath: 'newslettersApi',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ['Newsletters'],
  endpoints: (builder) => ({
    getNewsletters: builder.query<Newsletter[], void>({
      query: () => ({ url: 'newsletters' }),
      providesTags: ['Newsletters'],
    }),
    getNewsletter: builder.query<Newsletter, number>({
      query: (id) => ({ url: `newsletters/${id}` }),
      providesTags: ['Newsletters'],
    }),
    createNewsletter: builder.mutation<Newsletter, CreateNewsletterDto>({
      query: (body) => ({ url: 'newsletters', method: 'POST', body }),
      invalidatesTags: ['Newsletters'],
    }),
    updateNewsletter: builder.mutation<Newsletter, { id: number; body: UpdateNewsletterDto }>({
      query: ({ id, body }) => ({ url: `newsletters/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Newsletters'],
    }),
    uploadAttachments: builder.mutation<NewsletterAttachment[], { id: number; files: File[] }>({
      query: ({ id, files }) => {
        const form = new FormData();
        for (const f of files) form.append('files', f);
        return { url: `newsletters/${id}/attachments`, method: 'POST', body: form };
      },
      invalidatesTags: ['Newsletters'],
    }),
    deleteAttachment: builder.mutation<void, { id: number; attachmentId: number }>({
      query: ({ id, attachmentId }) => ({
        url: `newsletters/${id}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Newsletters'],
    }),
  }),
});

export const {
  useGetNewslettersQuery,
  useGetNewsletterQuery,
  useCreateNewsletterMutation,
  useUpdateNewsletterMutation,
  useUploadAttachmentsMutation,
  useDeleteAttachmentMutation,
} = newslettersApi;
