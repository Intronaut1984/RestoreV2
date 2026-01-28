import { Link, useParams } from "react-router-dom"
import { useFetchOrderDetailedQuery } from "./orderApi";
import { Box, Button, Divider, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { format } from "date-fns";
import { formatAddressString, formatPaymentString, formatOrderAmount } from "../../lib/util";

export default function OrderDetailedPage() {
    const { id } = useParams();

    const { data: order, isLoading } = useFetchOrderDetailedQuery(+id!)

    if (isLoading) return <Typography variant="h5">A carregar encomenda...</Typography>

    if (!order) return <Typography variant="h5">Encomenda não encontrada</Typography>

    return (
        <Box sx={{ maxWidth: 'md', mx: 'auto', px: 1 }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                <Typography variant="h5" align="center">
                    Resumo da Encomenda #{order.id}
                </Typography>
                <Button component={Link} to='/orders' variant='outlined'>
                    Voltar às Encomendas
                </Button>
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
                    <Typography variant='body2' fontWeight='300'>{order.orderStatus}</Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, mt: 1 }}>
                    <Typography variant='subtitle1' fontWeight='500'>Data da encomenda</Typography>
                    <Typography variant='body2' fontWeight='300'>{format(order.orderDate, 'dd MMM yyyy')}</Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

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
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, color: 'green' }}>{formatOrderAmount(order.discount)}</Box>
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