import { Link, useParams } from "react-router-dom";
import {
  useFetchAnyOrderDetailedQuery,
  useFetchOrderIncidentQuery,
  useResolveOrderIncidentMutation,
  useReplyOrderIncidentMutation,
  useReplyOrderCommentMutation,
  useUpdateAnyOrderStatusMutation,
  useUpdateAnyOrderTrackingMutation,
} from "../orders/orderApi";
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepButton,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import {
  formatAddressString,
  formatPaymentString,
  formatOrderAmount,
} from "../../lib/util";
import { secondaryActionSx } from "../../app/shared/styles/actionButtons";
import {
  adminOrderStatusOptions,
  getOrderStatusLabel,
  getOrderStatusSx,
} from "../../lib/orderStatus";
import { useEffect, useState } from "react";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { getIncidentStatusLabel } from "../../lib/incidentStatus";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error) return null;

  const maybeFetchError = error as FetchBaseQueryError;
  if (maybeFetchError && typeof maybeFetchError === "object" && "data" in maybeFetchError) {
    const data = (maybeFetchError as { data?: unknown }).data;
    if (typeof data === "string") return data;
  }

  return fallback;
}

export default function AdminSaleDetailedPage() {
  const { id } = useParams();
  const theme = useTheme();

  const [updateStatus, { isLoading: isUpdating, error: updateError }] =
    useUpdateAnyOrderStatusMutation();

  const [updateTracking, { isLoading: isUpdatingTracking, error: trackingError }] =
    useUpdateAnyOrderTrackingMutation();

  const { data: order, isLoading } = useFetchAnyOrderDetailedQuery(+id!);
  const { data: incident, isLoading: isIncidentLoading, refetch: refetchIncident } = useFetchOrderIncidentQuery(+id!);
  const [resolveIncident, { isLoading: isResolvingIncident, error: resolveIncidentError }] = useResolveOrderIncidentMutation();
  const [replyIncident, { isLoading: isReplyingIncident, error: replyIncidentError }] = useReplyOrderIncidentMutation();
  const [replyComment, { isLoading: isReplyingComment, error: replyCommentError }] = useReplyOrderCommentMutation();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingSaved, setTrackingSaved] = useState(false);
  const [incidentReplyText, setIncidentReplyText] = useState('');
  const [commentReplyText, setCommentReplyText] = useState('');
  const [replySaved, setReplySaved] = useState(false);

  useEffect(() => {
    if (order?.orderStatus) setSelectedStatus(order.orderStatus);
  }, [order?.orderStatus]);

  useEffect(() => {
    setTrackingNumber(order?.trackingNumber ?? '');
  }, [order?.trackingNumber]);

  useEffect(() => {
    setIncidentReplyText(incident?.adminReply ?? '');
  }, [incident?.adminReply]);

  useEffect(() => {
    setCommentReplyText(order?.adminCommentReply ?? '');
  }, [order?.adminCommentReply]);

  if (isLoading)
    return <Typography variant="h5">A carregar encomenda...</Typography>;

  if (!order) return <Typography variant="h5">Encomenda não encontrada</Typography>;

  const apiBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api/').replace(/\/?$/, '/');
  const receiptUrl = `${apiBaseUrl}orders/all/${order.id}/invoice`;
  const incidentAttachmentUrl = (attachmentId: number) => `${apiBaseUrl}orders/${order.id}/incident/attachments/${attachmentId}`;
  const cttUrl = trackingNumber.trim().length
    ? `https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx?objects=${encodeURIComponent(trackingNumber.trim())}`
    : '';

  const showTrackingEditor = selectedStatus === 'Shipped' || order.orderStatus === 'Shipped';

  const selectOptions = (() => {
    const base = adminOrderStatusOptions;
    if (!order.orderStatus) return base;
    const exists = base.some((o) => o.value === order.orderStatus);
    return exists
      ? base
      : [{ value: order.orderStatus, label: getOrderStatusLabel(order.orderStatus) }, ...base];
  })();

  const progressStatuses = [
    "PaymentReceived",
    "Processing",
    "Processed",
    "Shipped",
    "Delivered",
    "ReviewRequested",
    "Completed",
  ];
  const activeProgressStep = progressStatuses.indexOf(order.orderStatus);

  return (
    <Box sx={{ maxWidth: "md", mx: "auto", px: 1 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="h5" align="center">
          Resumo da Venda #{order.id}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component="a"
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            sx={secondaryActionSx(theme)}
          >
            Recibo (PDF)
          </Button>
          <Button
            component={Link}
            to="/admin/sales"
            variant="outlined"
            sx={secondaryActionSx(theme)}
          >
            Voltar às Vendas
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Cliente
        </Typography>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Email
          </Typography>
          <Typography variant="body2" fontWeight="300">
            {order.buyerEmail}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Detalhes da Encomenda
        </Typography>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Morada de envio
          </Typography>
          <Typography variant="body2" fontWeight="300">
            {formatAddressString(order.shippingAddress)}
          </Typography>
        </Box>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Detalhes do pagamento
          </Typography>
          <Typography variant="body2" fontWeight="300">
            {formatPaymentString(order.paymentSummary)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Estado
        </Typography>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Estado da encomenda
          </Typography>
          <Typography variant="body2" fontWeight="300" sx={{ ...getOrderStatusSx(order.orderStatus) }}>
            {getOrderStatusLabel(order.orderStatus)}
          </Typography>
        </Box>

        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">Atualizar estado</Typography>

          <Box sx={{ mt: 1 }}>
            <Stepper nonLinear activeStep={activeProgressStep} alternativeLabel>
              {progressStatuses.map((s) => (
                <Step key={s}>
                  <StepButton
                    onClick={() => {
                      setSaved(false);
                      setSelectedStatus(s);
                    }}
                  >
                    {getOrderStatusLabel(s)}
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          </Box>

          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="admin-order-status-label">Estado</InputLabel>
            <Select
              labelId="admin-order-status-label"
              value={selectedStatus}
              label="Estado"
              onChange={(e) => {
                setSaved(false);
                setSelectedStatus(e.target.value);
              }}
            >
              {selectOptions.map((opt) => (
                <MenuItem
                  key={opt.value}
                  value={opt.value}
                  disabled={!adminOrderStatusOptions.some((o) => o.value === opt.value)}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {updateError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {getApiErrorMessage(updateError, 'Não foi possível atualizar o estado')}
            </Typography>
          )}
          {saved && (
            <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
              Estado atualizado.
            </Typography>
          )}

          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              disabled={isUpdating || !selectedStatus || selectedStatus === order.orderStatus}
              onClick={async () => {
                setSaved(false);
                try {
                  const trimmedTracking = trackingNumber.trim();
                  const payload = selectedStatus === 'Shipped' && trimmedTracking.length >= 6
                    ? { id: order.id, status: selectedStatus, trackingNumber: trimmedTracking }
                    : { id: order.id, status: selectedStatus };

                  await updateStatus(payload).unwrap();
                  setSaved(true);
                } catch {
                  // handled via updateError
                }
              }}
            >
              Guardar estado
            </Button>
          </Box>
        </Box>

        {showTrackingEditor && (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="500">Tracking CTT</Typography>

            {!!order.trackingNumber && (
              <Typography variant="body2" fontWeight="300" sx={{ mt: 0.5 }}>
                Atual: {order.trackingNumber}
              </Typography>
            )}

            <TextField
              fullWidth
              sx={{ mt: 1 }}
              value={trackingNumber}
              onChange={(e) => {
                setTrackingSaved(false);
                setTrackingNumber(e.target.value);
              }}
              label="Número de tracking"
              placeholder="Ex: XX123456789PT"
            />

            {selectedStatus === 'Shipped' && order.orderStatus !== 'Shipped' && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Se preencher, será guardado ao guardar o estado como “Enviado”.
              </Typography>
            )}

            {!!cttUrl && (
              <Button
                component="a"
                href={cttUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                sx={{ mt: 0.5, px: 0 }}
              >
                Abrir tracking CTT
              </Button>
            )}

            {trackingError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {getApiErrorMessage(trackingError, 'Não foi possível guardar o tracking')}
              </Typography>
            )}
            {trackingSaved && (
              <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                Tracking guardado.
              </Typography>
            )}

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                disabled={
                  isUpdatingTracking ||
                  trackingNumber.trim().length < 6 ||
                  trackingNumber.trim() === (order.trackingNumber ?? '')
                }
                onClick={async () => {
                  setTrackingSaved(false);
                  try {
                    await updateTracking({ id: order.id, trackingNumber: trackingNumber.trim() }).unwrap();
                    setTrackingSaved(true);
                  } catch {
                    // handled via trackingError
                  }
                }}
              >
                Guardar tracking
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Data da encomenda
          </Typography>
          <Typography variant="body2" fontWeight="300">
            {format(order.orderDate, "dd MMM yyyy")}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Incidente</Typography>

        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">Estado</Typography>
          <Typography variant="body2" fontWeight="300">
            {isIncidentLoading ? 'A carregar...' : getIncidentStatusLabel(incident?.status)}
          </Typography>
        </Box>

        {!isIncidentLoading && incident?.status !== 'None' && incident?.description && (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="500">Descrição</Typography>
            <Typography variant="body2" fontWeight="300" sx={{ whiteSpace: 'pre-wrap' }}>
              {incident.description}
            </Typography>
          </Box>
        )}

        {!isIncidentLoading && incident?.status !== 'None' && (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="500">Resposta ao cliente</Typography>

            {incident?.adminReply && (
              <Typography variant="body2" fontWeight="300" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                {incident.adminReply}
              </Typography>
            )}

            <TextField
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 1 }}
              value={incidentReplyText}
              onChange={(e) => {
                setReplySaved(false);
                setIncidentReplyText(e.target.value);
              }}
              placeholder="Escreva a resposta ao cliente"
            />

            {replyIncidentError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {getApiErrorMessage(replyIncidentError, 'Não foi possível enviar a resposta')}
              </Typography>
            )}

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                disabled={isReplyingIncident || !incidentReplyText.trim()}
                onClick={async () => {
                  try {
                    setReplySaved(false);
                    await replyIncident({ id: order.id, reply: incidentReplyText.trim() }).unwrap();
                    setReplySaved(true);
                    refetchIncident();
                  } catch {
                    // handled via replyIncidentError
                  }
                }}
              >
                Enviar resposta
              </Button>
            </Box>
          </Box>
        )}

        {!isIncidentLoading && (incident?.attachments?.length ?? 0) > 0 && (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="500">Anexos</Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(incident?.attachments ?? []).map((a) => (
                <Button
                  key={a.id}
                  component="a"
                  href={incidentAttachmentUrl(a.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant='outlined'
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {a.originalFileName}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {resolveIncidentError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {getApiErrorMessage(resolveIncidentError, 'Não foi possível resolver o incidente')}
          </Typography>
        )}

        {!isIncidentLoading && incident?.status === 'Open' && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant='contained'
              disabled={isResolvingIncident}
              onClick={async () => {
                try {
                  await resolveIncident({ id: order.id }).unwrap();
                  refetchIncident();
                } catch {
                  // handled via resolveIncidentError
                }
              }}
            >
              Resolver incidente
            </Button>
          </Box>
        )}
      </Box>

      {order.customerComment && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">Avaliação do cliente</Typography>
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
              <Typography variant="subtitle1" fontWeight="500">Comentário</Typography>
              <Typography variant="body2" fontWeight="300">{order.customerComment}</Typography>
              {order.customerCommentedAt && (
                <Typography variant="caption" fontWeight="300">
                  {format(order.customerCommentedAt, 'dd MMM yyyy')}
                </Typography>
              )}
            </Box>

            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, mt: 1 }}>
              <Typography variant="subtitle1" fontWeight="500">Resposta ao cliente</Typography>

              {order.adminCommentReply && (
                <Typography variant="body2" fontWeight="300" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                  {order.adminCommentReply}
                </Typography>
              )}

              <TextField
                fullWidth
                multiline
                minRows={3}
                sx={{ mt: 1 }}
                value={commentReplyText}
                onChange={(e) => {
                  setReplySaved(false);
                  setCommentReplyText(e.target.value);
                }}
                placeholder="Escreva a resposta ao comentário do cliente"
              />

              {replyCommentError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {getApiErrorMessage(replyCommentError, 'Não foi possível enviar a resposta')}
                </Typography>
              )}

              {replySaved && (
                <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                  Resposta enviada.
                </Typography>
              )}

              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant='contained'
                  disabled={isReplyingComment || !commentReplyText.trim()}
                  onClick={async () => {
                    try {
                      setReplySaved(false);
                      await replyComment({ id: order.id, reply: commentReplyText.trim() }).unwrap();
                      setReplySaved(true);
                    } catch {
                      // handled via replyCommentError
                    }
                  }}
                >
                  Enviar resposta
                </Button>
              </Box>
            </Box>
          </Box>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <TableContainer>
        <Table>
          <TableBody>
            {order.orderItems.map((item) => (
              <TableRow
                key={`${item.productId}-${item.productVariantId ?? 'base'}`}
                sx={{ borderBottom: "1px solid rgba(224, 224, 224, 1)" }}
              >
                <TableCell sx={{ py: 4 }}>
                  <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
                    <img
                      src={item.pictureUrl}
                      alt={item.name}
                      style={{ width: 40, height: 40 }}
                    />
                    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
                      <Typography>{item.name}</Typography>
                      {!!item.variantColor && (
                        <Typography variant="body2" color="text.secondary">
                          Cor: {item.variantColor}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ p: 4 }}>
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
                    x {item.quantity}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ p: 4 }}>
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
                    {formatOrderAmount(item.price * item.quantity)}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mx={0} sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Subtotal
          </Typography>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
            {formatOrderAmount(order.subtotal)}
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Desconto
          </Typography>
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: 1,
              color: "green",
            }}
          >
            {formatOrderAmount(order.productDiscount + order.discount)}
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="500">
            Taxa de entrega
          </Typography>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
            {formatOrderAmount(order.deliveryFee)}
          </Box>
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="500">
          Total
        </Typography>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: 1,
            fontWeight: 700,
          }}
        >
          {formatOrderAmount(order.total)}
        </Box>
      </Box>
    </Box>
  );
}
