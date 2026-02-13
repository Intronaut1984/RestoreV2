import { Link, useLocation, useParams } from "react-router-dom"
import { useAddOrderCommentMutation, useFetchOrderDetailedQuery, useFetchOrderIncidentQuery, useOpenOrderIncidentMutation, useRequestRefundMutation } from "./orderApi";
import { Box, Button, Divider, FormControl, InputLabel, MenuItem, Rating, Select, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { addDays, format } from "date-fns";
import { formatAddressString, formatPaymentString, formatOrderAmount } from "../../lib/util";
import { secondaryActionSx } from "../../app/shared/styles/actionButtons";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useEffect, useRef } from "react";
import { useCreateProductReviewMutation } from "../catalog/catalogApi";

function getApiErrorMessage(error: unknown, fallback: string) {
    if (!error) return null;

    const maybeFetchError = error as FetchBaseQueryError;
    if (maybeFetchError && typeof maybeFetchError === "object" && "data" in maybeFetchError) {
        const data = (maybeFetchError as { data?: unknown }).data;
        if (typeof data === "string") return data;
    }

    return fallback;
}
import { getOrderStatusLabel, getOrderStatusSx } from "../../lib/orderStatus";
import { useState } from "react";
import { getIncidentStatusLabel } from "../../lib/incidentStatus";

export default function OrderDetailedPage() {
    const { id } = useParams();
    const location = useLocation();
    const theme = useTheme();

    const { data: order, isLoading, refetch } = useFetchOrderDetailedQuery(+id!)
    const [addComment, { isLoading: isSubmitting, error: commentError }] = useAddOrderCommentMutation();
    const [createProductReview, { isLoading: isSubmittingProductReview }] = useCreateProductReviewMutation();
    const [requestRefund, { isLoading: isRequestingRefund, error: refundError }] = useRequestRefundMutation();

    const { data: incident, isLoading: isIncidentLoading, refetch: refetchIncident } = useFetchOrderIncidentQuery(+id!);
    const [openIncident, { isLoading: isOpeningIncident, error: incidentError }] = useOpenOrderIncidentMutation();

    const [comment, setComment] = useState("");
    const [commentSaved, setCommentSaved] = useState(false);
    const [refundSaved, setRefundSaved] = useState(false);

    const [productReviewState, setProductReviewState] = useState<Record<number, { rating: number; comment: string; saved: boolean; error: string | null }>>({});

    const commentInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        if (sp.get('feedback') === '1') {
            window.setTimeout(() => {
                commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                commentInputRef.current?.focus();
            }, 150);
        }
    }, [location.search]);

    const [showIncidentForm, setShowIncidentForm] = useState(false);
    const [incidentDescription, setIncidentDescription] = useState("");
    const [incidentProductId, setIncidentProductId] = useState<string>("");
    const [incidentFiles, setIncidentFiles] = useState<File[]>([]);
    const [incidentSaved, setIncidentSaved] = useState(false);

    const [trackingCopied, setTrackingCopied] = useState(false);

    if (isLoading) return <Typography variant="h5">A carregar encomenda...</Typography>

    if (!order) return <Typography variant="h5">Encomenda não encontrada</Typography>

    const canComment = order.orderStatus === 'ReviewRequested' && !order.customerComment;
    const canShowServiceFeedback = order.orderStatus === 'Delivered' || order.orderStatus === 'ReviewRequested' || order.orderStatus === 'Completed';

    const orderedProducts = Array.from(
        new Map(
            order.orderItems.map((oi) => [oi.productId, { productId: oi.productId, name: oi.name }])
        ).values()
    );

    const orderDate = new Date(order.orderDate);
    const refundDeadline = addDays(orderDate, 30);
    const isRefundEligible =
        !Number.isNaN(orderDate.getTime()) &&
        Date.now() <= refundDeadline.getTime() &&
        order.orderStatus !== 'Pending' &&
        order.orderStatus !== 'PaymentFailed' &&
        order.orderStatus !== 'Cancelled' &&
        order.refundRequestStatus === 'None';

    const refundStatusLabel = (() => {
        switch (order.refundRequestStatus) {
            case 'PendingReview':
                return 'Pedido de devolução em avaliação';
            case 'Approved':
                return 'Pedido de devolução aceite';
            case 'Rejected':
                return 'Pedido de devolução recusado';
            default:
                return null;
        }
    })();

    const apiBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api/').replace(/\/?$/, '/');
    const receiptUrl = `${apiBaseUrl}orders/${order.id}/invoice`;
    const incidentAttachmentUrl = (attachmentId: number) => `${apiBaseUrl}orders/${order.id}/incident/attachments/${attachmentId}`;
    const cttUrl = order.trackingNumber
        ? `https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx?objects=${encodeURIComponent(order.trackingNumber)}`
        : '';

    const productUrlForOrderItem = (productId: number, variantId: number | null | undefined) => {
        return variantId ? `/catalog/${productId}?variantId=${variantId}` : `/catalog/${productId}`;
    };

    const handleCopyTracking = async () => {
        const tracking = order.trackingNumber?.trim();
        if (!tracking) return;
        try {
            await navigator.clipboard.writeText(tracking);
            setTrackingCopied(true);
            window.setTimeout(() => setTrackingCopied(false), 1500);
        } catch {
            // Ignore if clipboard is not available
        }
    };

    return (
        <Box sx={{ maxWidth: 'md', mx: 'auto', px: 1 }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                <Typography variant="h5" align="center">
                    Resumo da Encomenda #{order.id}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        component="a"
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant='outlined'
                        sx={secondaryActionSx(theme)}
                    >
                        Recibo (PDF)
                    </Button>
                    {isRefundEligible && (
                        <Button
                            variant='outlined'
                            sx={secondaryActionSx(theme)}
                            disabled={isRequestingRefund}
                            onClick={async () => {
                                if (!window.confirm('Pretende pedir a devolução desta encomenda? O pedido ficará em avaliação até ser aceite pela loja.')) return;

                                const reason = (window.prompt('Explique o porquê da devolução/troca (mínimo 20 caracteres):') ?? '').trim();
                                if (!reason || reason.length < 20) {
                                    window.alert('O comentário deve ter pelo menos 20 caracteres.');
                                    return;
                                }

                                const inStore = window.confirm('A devolução será feita fisicamente na loja?\nOK = Loja\nCancelar = Correio');
                                const returnMethod = (inStore ? 'InStore' : 'ByMail') as ('InStore' | 'ByMail');

                                setRefundSaved(false);
                                try {
                                    await requestRefund({ id: order.id, reason, returnMethod }).unwrap();
                                    setRefundSaved(true);
                                    refetch();
                                } catch {
                                    // handled via refundError
                                }
                            }}
                        >
                            Pedir devolução
                        </Button>
                    )}
                    <Button component={Link} to='/orders' variant='outlined' sx={secondaryActionSx(theme)}>
                        Voltar às Encomendas
                    </Button>
                </Box>
            </Box>

            {refundError && (
                <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                    {getApiErrorMessage(refundError, 'Não foi possível pedir a devolução')}
                </Typography>
            )}
            {refundSaved && (
                <Typography variant='body2' sx={{ mt: 1, color: 'green' }}>
                    Pedido de devolução enviado. Está em avaliação.
                </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight='bold'>
                    Detalhes da Encomenda
                </Typography>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Morada de envio</Typography>
                    <Typography variant='body2' fontWeight='300'>{formatAddressString(order.shippingAddress)}</Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Detalhes do pagamento</Typography>
                    <Typography variant='body2' fontWeight='300'>{formatPaymentString(order.paymentSummary)}</Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight='bold'>Detalhes da Encomenda</Typography>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Endereço de email</Typography>
                    <Typography variant='body2' fontWeight='300'>{order.buyerEmail}</Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Estado da encomenda</Typography>
                    <Typography variant='body2' fontWeight='300' sx={{ ...getOrderStatusSx(order.orderStatus) }}>{getOrderStatusLabel(order.orderStatus)}</Typography>
                </Box>

                {refundStatusLabel && (
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                        <Typography variant='subtitle1' fontWeight='500'>Devolução</Typography>
                        <Typography
                            variant='body2'
                            fontWeight='300'
                            sx={order.refundRequestStatus === 'Approved' ? { color: 'success.main' } : undefined}
                        >
                            {refundStatusLabel}
                        </Typography>
                        {order.refundReturnMethod && order.refundReturnMethod !== 'None' && (
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                Método: {order.refundReturnMethod === 'InStore' ? 'Loja' : (order.refundReturnMethod === 'ByMail' ? 'Correio' : order.refundReturnMethod)}
                            </Typography>
                        )}
                        {order.refundRequestReason && (
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                O seu comentário: {order.refundRequestReason}
                            </Typography>
                        )}
                        {order.refundReviewNote && (
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                Comentário da Loja: {order.refundReviewNote}
                            </Typography>
                        )}
                    </Box>
                )}

                {!!order.trackingNumber && (
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                        <Typography variant='subtitle1' fontWeight='500'>Tracking CTT</Typography>
                        <Typography variant='body2' fontWeight='300'>{order.trackingNumber}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                            <Button variant='text' sx={{ px: 0 }} onClick={handleCopyTracking}>
                                {trackingCopied ? 'Copiado' : 'Copiar'}
                            </Button>
                            {!!cttUrl && (
                                <Button
                                    component="a"
                                    href={cttUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant='text'
                                    sx={{ px: 0 }}
                                >
                                    Acompanhar no site dos CTT
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Data da encomenda</Typography>
                    <Typography variant='body2' fontWeight='300'>{format(order.orderDate, 'dd MMM yyyy')}</Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight='bold'>Incidente</Typography>

                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Estado</Typography>
                    <Typography variant='body2' fontWeight='300'>
                        {isIncidentLoading ? 'A carregar...' : getIncidentStatusLabel(incident?.status)}
                    </Typography>
                </Box>

                {!isIncidentLoading && incident?.status === 'None' && (
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant='contained'
                            onClick={() => {
                                setIncidentSaved(false);
                                setShowIncidentForm((v) => !v);
                            }}
                        >
                            {showIncidentForm ? 'Cancelar' : 'Abrir incidente'}
                        </Button>
                    </Box>
                )}

                {incidentSaved && (
                    <Typography variant='body2' sx={{ mt: 1, color: 'green' }}>
                        Incidente aberto com sucesso.
                    </Typography>
                )}

                {incidentError && (
                    <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                        {getApiErrorMessage(incidentError, 'Não foi possível abrir o incidente')}
                    </Typography>
                )}

                {!isIncidentLoading && incident?.status !== 'None' && incident?.description && (
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                        <Typography variant='subtitle1' fontWeight='500'>Descrição</Typography>
                        <Typography variant='body2' fontWeight='300' sx={{ whiteSpace: 'pre-wrap' }}>
                            {incident.description}
                        </Typography>
                    </Box>
                )}

                {!isIncidentLoading && incident?.status !== 'None' && incident?.adminReply && (
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                        <Typography variant='subtitle1' fontWeight='500'>Resposta do suporte</Typography>
                        <Typography variant='body2' fontWeight='300' sx={{ whiteSpace: 'pre-wrap' }}>
                            {incident.adminReply}
                        </Typography>
                    </Box>
                )}

                {!isIncidentLoading && (incident?.attachments?.length ?? 0) > 0 && (
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                        <Typography variant='subtitle1' fontWeight='500'>Anexos</Typography>
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

                {!isIncidentLoading && incident?.status === 'None' && showIncidentForm && (
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                        <Typography variant='subtitle1' fontWeight='500'>Abrir incidente</Typography>

                        <FormControl fullWidth sx={{ mt: 1 }}>
                            <InputLabel id="incident-product-label">Produto (opcional)</InputLabel>
                            <Select
                                labelId="incident-product-label"
                                value={incidentProductId}
                                label="Produto (opcional)"
                                onChange={(e) => setIncidentProductId(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Todos os produtos</em>
                                </MenuItem>
                                {order.orderItems.map((item) => (
                                    <MenuItem key={item.productId} value={String(item.productId)}>
                                        {item.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            value={incidentDescription}
                            onChange={(e) => setIncidentDescription(e.target.value)}
                            placeholder="Descreva o problema (mín. 10 caracteres)"
                            multiline
                            minRows={4}
                            fullWidth
                            sx={{ mt: 1 }}
                        />

                        <Box sx={{ mt: 1 }}>
                            <Button variant='outlined' component="label">
                                Selecionar ficheiros
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    onChange={(e) => {
                                        const list = e.target.files ? Array.from(e.target.files) : [];
                                        setIncidentFiles(list);
                                    }}
                                />
                            </Button>
                            {incidentFiles.length > 0 && (
                                <Typography variant='body2' sx={{ mt: 1 }}>
                                    {incidentFiles.length} ficheiro(s) selecionado(s)
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant='contained'
                                disabled={isOpeningIncident || incidentDescription.trim().length < 10}
                                onClick={async () => {
                                    setIncidentSaved(false);
                                    try {
                                        await openIncident({
                                            id: order.id,
                                            productId: incidentProductId ? Number(incidentProductId) : null,
                                            description: incidentDescription,
                                            files: incidentFiles
                                        }).unwrap();

                                        setIncidentDescription('');
                                        setIncidentProductId('');
                                        setIncidentFiles([]);
                                        setShowIncidentForm(false);
                                        setIncidentSaved(true);
                                        refetchIncident();
                                    } catch {
                                        // handled via incidentError
                                    }
                                }}
                            >
                                Abrir incidente
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {canShowServiceFeedback && (order.customerComment || canComment) && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight='bold'>Feedback à loja (serviço)</Typography>

                    {order.customerComment && (
                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                            <Typography variant='subtitle1' fontWeight='500'>Comentário sobre o serviço</Typography>
                            <Typography variant='body2' fontWeight='300'>{order.customerComment}</Typography>
                            {order.customerCommentedAt && (
                                <Typography variant='caption' fontWeight='300'>
                                    {format(order.customerCommentedAt, 'dd MMM yyyy')}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {order.adminCommentReply && (
                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                            <Typography variant='subtitle1' fontWeight='500'>Resposta da loja</Typography>
                            <Typography variant='body2' fontWeight='300' sx={{ whiteSpace: 'pre-wrap' }}>
                                {order.adminCommentReply}
                            </Typography>
                        </Box>
                    )}

                    {canComment && (
                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                            <Typography variant='subtitle1' fontWeight='500'>Deixe o seu feedback</Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                Este comentário é sobre a experiência/serviço da encomenda. Para avaliar um produto, use a secção
                                “Avaliações” na página do produto.
                            </Typography>
                            <TextField
                                inputRef={commentInputRef}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escreva aqui..."
                                multiline
                                minRows={3}
                                fullWidth
                                sx={{ mt: 1 }}
                            />
                            {commentError && (
                                <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                                    {getApiErrorMessage(commentError, 'Não foi possível guardar o comentário')}
                                </Typography>
                            )}
                            {commentSaved && (
                                <Typography variant='body2' sx={{ mt: 1, color: 'green' }}>
                                    Comentário guardado com sucesso.
                                </Typography>
                            )}
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant='contained'
                                    disabled={isSubmitting || comment.trim().length < 3}
                                    onClick={async () => {
                                        setCommentSaved(false);
                                        try {
                                            await addComment({ id: order.id, comment }).unwrap();
                                            setComment('');
                                            setCommentSaved(true);
                                            refetch();
                                        } catch {
                                            // handled via commentError
                                        }
                                    }}
                                >
                                    Enviar comentário
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            )}

            {canShowServiceFeedback && orderedProducts.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight='bold'>Avaliações de produtos</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                        Estas avaliações são públicas e aparecem na página do produto.
                    </Typography>

                    <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
                        {orderedProducts.map((p) => {
                            const s = productReviewState[p.productId] ?? { rating: 5, comment: '', saved: false, error: null };

                            return (
                                <Box key={p.productId} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Typography variant='subtitle1' fontWeight='700' sx={{ minWidth: 0 }}>
                                            {p.name}
                                        </Typography>
                                        <Button
                                            component={Link}
                                            to={`/catalog/${p.productId}?review=1`}
                                            variant='outlined'
                                            sx={secondaryActionSx(theme)}
                                        >
                                            Ver produto
                                        </Button>
                                    </Box>

                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Rating
                                            value={s.rating}
                                            onChange={(_, value) => {
                                                const nextRating = value ?? 5;
                                                setProductReviewState((prev) => ({
                                                    ...prev,
                                                    [p.productId]: { ...s, rating: nextRating, saved: false, error: null }
                                                }));
                                            }}
                                        />
                                        <Typography variant='body2' color='text.secondary'>
                                            {s.rating}/5
                                        </Typography>
                                    </Box>

                                    <TextField
                                        value={s.comment}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setProductReviewState((prev) => ({
                                                ...prev,
                                                [p.productId]: { ...s, comment: v, saved: false, error: null }
                                            }));
                                        }}
                                        placeholder="Escreva a sua avaliação do produto..."
                                        multiline
                                        minRows={3}
                                        fullWidth
                                        sx={{ mt: 1 }}
                                    />

                                    {s.error && (
                                        <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                                            {s.error}
                                        </Typography>
                                    )}
                                    {s.saved && (
                                        <Typography variant='body2' sx={{ mt: 1, color: 'green' }}>
                                            Avaliação enviada com sucesso.
                                        </Typography>
                                    )}

                                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant='contained'
                                            disabled={isSubmittingProductReview || s.comment.trim().length < 3}
                                            onClick={async () => {
                                                setProductReviewState((prev) => ({
                                                    ...prev,
                                                    [p.productId]: { ...s, saved: false, error: null }
                                                }));
                                                try {
                                                    await createProductReview({
                                                        productId: p.productId,
                                                        rating: s.rating,
                                                        comment: s.comment
                                                    }).unwrap();

                                                    setProductReviewState((prev) => ({
                                                        ...prev,
                                                        [p.productId]: { rating: 5, comment: '', saved: true, error: null }
                                                    }));
                                                } catch (e) {
                                                    setProductReviewState((prev) => ({
                                                        ...prev,
                                                        [p.productId]: { ...s, saved: false, error: typeof e === 'string' ? e : 'Não foi possível enviar a avaliação' }
                                                    }));
                                                }
                                            }}
                                        >
                                            Enviar avaliação
                                        </Button>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}

            <TableContainer>
                <Table>
                    <TableBody>
                        {order.orderItems.map((item) => (
                            <TableRow key={`${item.productId}-${item.productVariantId ?? 'base'}`} sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                <TableCell sx={{ py: 4 }}>
                                    <Box
                                        component={Link}
                                        to={productUrlForOrderItem(item.productId, item.productVariantId)}
                                        sx={{
                                            display: 'flex',
                                            gap: 3,
                                            alignItems: 'center',
                                            textDecoration: 'none',
                                            color: 'inherit'
                                        }}
                                    >
                                        <img src={item.pictureUrl} alt={item.name} style={{ width: 40, height: 40 }} />
                                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
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
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>x {item.quantity}</Box>
                                </TableCell>
                                <TableCell align="right" sx={{ p: 4 }}>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>{formatOrderAmount(item.price * item.quantity)}</Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box mx={0} sx={{ mt: 2 }}>
                <Box display='flex' justifyContent='space-between' sx={{ mb: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Subtotal</Typography>
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>{formatOrderAmount(order.subtotal)}</Box>
                </Box>
                <Box display='flex' justifyContent='space-between' sx={{ mb: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Desconto</Typography>
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, color: 'green' }}>{formatOrderAmount(order.productDiscount + order.discount)}</Box>
                </Box>
                <Box display='flex' justifyContent='space-between' sx={{ mb: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Taxa de entrega</Typography>
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>{formatOrderAmount(order.deliveryFee)}</Box>
                </Box>
            </Box>
            <Box display='flex' justifyContent='space-between' sx={{ mt: 2 }}>
                <Typography variant='subtitle1' fontWeight='500'>Total</Typography>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, fontWeight: 700 }}>{formatOrderAmount(order.total)}</Box>
            </Box>
        </Box>
    )
}