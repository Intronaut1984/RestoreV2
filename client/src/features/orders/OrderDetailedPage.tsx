import { Link, useParams } from "react-router-dom"
import { useAddOrderCommentMutation, useFetchOrderDetailedQuery } from "./orderApi";
import { Box, Button, Divider, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import { formatAddressString, formatPaymentString, formatOrderAmount } from "../../lib/util";
import { secondaryActionSx } from "../../app/shared/styles/actionButtons";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

function getApiErrorMessage(error: unknown, fallback: string) {
    if (!error) return null;

    const maybeFetchError = error as FetchBaseQueryError;
    if (maybeFetchError && typeof maybeFetchError === "object" && "data" in maybeFetchError) {
        const data = (maybeFetchError as { data?: unknown }).data;
        if (typeof data === "string") return data;
    }

    return fallback;
}
import { getOrderStatusLabel } from "../../lib/orderStatus";
import { useState } from "react";

export default function OrderDetailedPage() {
    const { id } = useParams();
    const theme = useTheme();

    const { data: order, isLoading } = useFetchOrderDetailedQuery(+id!)
    const [addComment, { isLoading: isSubmitting, error: commentError }] = useAddOrderCommentMutation();
    const [comment, setComment] = useState("");
    const [commentSaved, setCommentSaved] = useState(false);

    if (isLoading) return <Typography variant="h5">A carregar encomenda...</Typography>

    if (!order) return <Typography variant="h5">Encomenda não encontrada</Typography>

    const canComment = order.orderStatus === 'ReviewRequested' && !order.customerComment;

    const apiBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api/').replace(/\/?$/, '/');
    const receiptUrl = `${apiBaseUrl}orders/${order.id}/invoice`;

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
                    <Button component={Link} to='/orders' variant='outlined' sx={secondaryActionSx(theme)}>
                        Voltar às Encomendas
                    </Button>
                </Box>
            </Box>

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
                    <Typography variant='body2' fontWeight='300'>{getOrderStatusLabel(order.orderStatus)}</Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Data da encomenda</Typography>
                    <Typography variant='body2' fontWeight='300'>{format(order.orderDate, 'dd MMM yyyy')}</Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {(order.customerComment || canComment) && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight='bold'>Avaliação</Typography>

                    {order.customerComment && (
                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                            <Typography variant='subtitle1' fontWeight='500'>Comentário</Typography>
                            <Typography variant='body2' fontWeight='300'>{order.customerComment}</Typography>
                            {order.customerCommentedAt && (
                                <Typography variant='caption' fontWeight='300'>
                                    {format(order.customerCommentedAt, 'dd MMM yyyy')}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {canComment && (
                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                            <Typography variant='subtitle1' fontWeight='500'>Deixe o seu comentário</Typography>
                            <TextField
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

            <TableContainer>
                <Table>
                    <TableBody>
                        {order.orderItems.map((item) => (
                            <TableRow key={item.productId} sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                <TableCell sx={{ py: 4 }}>
                                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                        <img src={item.pictureUrl} alt={item.name} style={{ width: 40, height: 40 }} />
                                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                                            <Typography>{item.name}</Typography>
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