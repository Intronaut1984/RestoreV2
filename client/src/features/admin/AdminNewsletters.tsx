import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  Newsletter,
  NewsletterAttachment,
  NewsletterStatus,
  useCreateNewsletterMutation,
  useDeleteAttachmentMutation,
  useGetNewslettersQuery,
  useUpdateNewsletterMutation,
  useUploadAttachmentsMutation,
} from './newslettersApi';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

const pad2 = (n: number) => String(n).padStart(2, '0');

const utcIsoToLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const localInputToUtcIso = (value: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const statusColor = (status: NewsletterStatus) => {
  switch (status) {
    case 'Draft':
      return 'default';
    case 'Scheduled':
      return 'info';
    case 'Sending':
      return 'warning';
    case 'Sent':
      return 'success';
    case 'Failed':
      return 'error';
    case 'Cancelled':
      return 'default';
    default:
      return 'default';
  }
};

export default function AdminNewsletters() {
  const { data: newsletters, isLoading, refetch } = useGetNewslettersQuery();
  const [createNewsletter, { isLoading: creating }] = useCreateNewsletterMutation();
  const [updateNewsletter, { isLoading: saving }] = useUpdateNewsletterMutation();
  const [uploadAttachments, { isLoading: uploading }] = useUploadAttachmentsMutation();
  const [deleteAttachment, { isLoading: deletingAttachment }] = useDeleteAttachmentMutation();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const editorEnabled = selectedId !== null;

  const selected = useMemo(() => {
    return newsletters?.find((n) => n.id === selectedId) ?? null;
  }, [newsletters, selectedId]);

  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [editorStatus, setEditorStatus] = useState<NewsletterStatus>('Draft');
  const [editorLastError, setEditorLastError] = useState<string | null>(null);

  const syncEditorFrom = (n: Newsletter) => {
    setSubject(n.subject ?? '');
    setHtmlContent(n.htmlContent ?? '');
    setScheduledLocal(utcIsoToLocalInput(n.scheduledForUtc));
    setEditorStatus(n.status);
    setEditorLastError(n.lastError ?? null);
  };

  useEffect(() => {
    if (selectedId !== null) return;
    if (!newsletters || newsletters.length === 0) return;

    const first = newsletters[0];
    setSelectedId(first.id);
    syncEditorFrom(first);
  }, [newsletters, selectedId]);

  const handleSelect = (n: Newsletter) => {
    setSelectedId(n.id);
    syncEditorFrom(n);
  };

  const handleCreate = async () => {
    try {
      const created = await createNewsletter({ subject: 'Nova newsletter', htmlContent: '' }).unwrap();
      setSelectedId(created.id);
      syncEditorFrom(created);
      toast.success('Newsletter criada');
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao criar newsletter');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedId) return;
    try {
      const res = await updateNewsletter({
        id: selectedId,
        body: {
          subject,
          htmlContent,
          status: 'Draft',
          scheduledForUtc: localInputToUtcIso(scheduledLocal),
        },
      }).unwrap();
      toast.success('Guardado');
      syncEditorFrom(res);
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao guardar');
    }
  };

  const handleSchedule = async () => {
    if (!selectedId) return;
    const scheduledForUtc = localInputToUtcIso(scheduledLocal);
    if (!scheduledForUtc) {
      toast.error('Escolhe uma data/hora para agendar');
      return;
    }

    try {
      const res = await updateNewsletter({
        id: selectedId,
        body: {
          subject,
          htmlContent,
          status: 'Scheduled',
          scheduledForUtc,
        },
      }).unwrap();
      toast.success('Agendada');
      syncEditorFrom(res);
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao agendar');
    }
  };

  const handleCancel = async () => {
    if (!selectedId) return;
    try {
      const res = await updateNewsletter({
        id: selectedId,
        body: {
          subject,
          htmlContent,
          status: 'Cancelled',
          scheduledForUtc: localInputToUtcIso(scheduledLocal),
        },
      }).unwrap();
      toast.success('Cancelada');
      syncEditorFrom(res);
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao cancelar');
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!selectedId || !files || files.length === 0) return;
    try {
      await uploadAttachments({ id: selectedId, files: Array.from(files) }).unwrap();
      toast.success('Anexos enviados');
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao enviar anexos');
    }
  };

  const attachmentUrl = (newsletterId: number, attachmentId: number) => {
    const rawBase = String(import.meta.env.VITE_API_URL || '/api/');
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    return `${base}newsletters/${newsletterId}/attachments/${attachmentId}`;
  };

  const handleDeleteAttachment = async (att: NewsletterAttachment) => {
    if (!selectedId) return;
    try {
      await deleteAttachment({ id: selectedId, attachmentId: att.id }).unwrap();
      toast.success('Anexo removido');
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao remover anexo');
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
        <Paper sx={{ p: 2, flex: 1, minWidth: 360 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Newsletters</Typography>
            <Button variant="contained" onClick={handleCreate} disabled={creating}>
              Criar
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Assunto</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Enviados</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(newsletters ?? []).map((n) => (
                  <TableRow
                    key={n.id}
                    hover
                    selected={n.id === selectedId}
                    onClick={() => handleSelect(n)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {n.subject || '(sem assunto)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {n.scheduledForUtc ? `Agendado: ${new Date(n.scheduledForUtc).toLocaleString()}` : `Criado: ${new Date(n.createdAtUtc).toLocaleString()}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={n.status} color={statusColor(n.status) as any} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{n.sentCount}/{n.totalRecipients}</Typography>
                      {n.failedCount > 0 && (
                        <Typography variant="caption" color="error">
                          {n.failedCount} falhas
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>

        <Paper sx={{ p: 2, flex: 2, minWidth: 360 }}>
          <Typography variant="h6">Editor</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editorEnabled ? `#${selectedId} · ${selected?.status ?? editorStatus}` : 'Seleciona uma newsletter para editar'}
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Assunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={false}
              helperText={!editorEnabled ? 'Cria ou seleciona uma newsletter para guardar/agendar' : ' '}
              fullWidth
            />

            <TextField
              label="Agendar (hora local)"
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              disabled={false}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Conteúdo HTML"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              disabled={false}
              multiline
              minRows={10}
              fullWidth
            />

            {(selected?.lastError ?? editorLastError) && (
              <Box>
                <Typography variant="subtitle2" color="error">
                  Último erro
                </Typography>
                <Typography variant="body2" color="error">
                  {selected?.lastError ?? editorLastError}
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="outlined" onClick={handleSaveDraft} disabled={!editorEnabled || saving}>
                Guardar rascunho
              </Button>
              <Button variant="contained" onClick={handleSchedule} disabled={!editorEnabled || saving}>
                Agendar
              </Button>
              <Button color="inherit" onClick={handleCancel} disabled={!editorEnabled || saving}>
                Cancelar
              </Button>
            </Stack>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Anexos
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Button variant="outlined" component="label" disabled={!editorEnabled || uploading}>
                  Enviar anexos
                  <input hidden type="file" multiple onChange={(e) => handleUpload(e.target.files)} />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  PDF/imagens até 10MB cada
                </Typography>
              </Stack>

              <Stack spacing={1} sx={{ mt: 2 }}>
                {(selected?.attachments ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Sem anexos
                  </Typography>
                ) : (
                  (selected?.attachments ?? []).map((att) => (
                    <Paper key={att.id} variant="outlined" sx={{ p: 1 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                        <Box>
                          <Typography variant="body2">{att.fileName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(att.sizeBytes / 1024)} KB · {att.contentType}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            component="a"
                            href={attachmentUrl(selected!.id, att.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAttachment(att)}
                            disabled={deletingAttachment}
                          >
                            Remover
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
