import { Container, Table, TableBody, TableCell, TableHead, TableRow, Typography, Box, CircularProgress, Skeleton } from "@mui/material";
import { useFetchOrdersQuery } from "./orderApi"
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatOrderAmount } from "../../lib/util";
import { getOrderStatusLabel, getOrderStatusSx } from "../../lib/orderStatus";

export default function OrdersPage() {
    const {data: orders, isLoading} = useFetchOrdersQuery();
    const navigate = useNavigate();

    if (isLoading) return (
        <Container maxWidth='md'>
            <Box sx={{ width: '100%', py: { xs: 6, md: 8 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <CircularProgress size={48} />
                </Box>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Encomenda</TableCell>
                            <TableCell>Produto</TableCell>
                            <TableCell>Data</TableCell>
                            <TableCell>Desconto</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={`skeleton-${i}`}>
                                <TableCell align="center"><Skeleton variant="rectangular" width={64} height={32} /></TableCell>
                                <TableCell><Skeleton width="70%" /></TableCell>
                                <TableCell><Skeleton width="60%" /></TableCell>
                                <TableCell><Skeleton width="40%" /></TableCell>
                                <TableCell><Skeleton width="40%" /></TableCell>
                                <TableCell><Skeleton width="40%" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Container>
    )

    if (!orders) return <Typography variant="h5">No orders available</Typography>

    return (
        <Container maxWidth='md'>
            <Typography variant="h6" align="center" gutterBottom sx={{ mb: 1 }}>
                As minhas Encomendas
            </Typography>
            <Box>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Encomenda</TableCell>
                            <TableCell>Produto</TableCell>
                            <TableCell>Data</TableCell>
                            <TableCell>Desconto</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map(order => (
                            <TableRow
                                key={order.id}
                                hover
                                onClick={() => navigate(`/orders/${order.id}`)}
                                style={{cursor: 'pointer'}}
                            >
                                <TableCell align="center">
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}># {order.id}</Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block', minWidth: 220 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {order.orderItems?.[0]?.pictureUrl && (
                                                <img
                                                    src={order.orderItems[0].pictureUrl}
                                                    alt={order.orderItems[0].name}
                                                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                                                />
                                            )}
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" noWrap>
                                                    {order.orderItems?.[0]?.name ?? '-'}
                                                </Typography>
                                                {order.orderItems && order.orderItems.length > 1 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        +{order.orderItems.length - 1} artigo(s)
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{format(order.orderDate, 'dd MMM yyyy')}</Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block', color: (order.productDiscount + order.discount) > 0 ? 'green' : 'inherit' }}>
                                        {(order.productDiscount + order.discount) > 0 ? formatOrderAmount(order.productDiscount + order.discount) : '-'}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{formatOrderAmount(order.total)}</Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ border: 1, borderRadius: 2, p: 1, display: 'inline-block', ...getOrderStatusSx(order.orderStatus) }}>{getOrderStatusLabel(order.orderStatus)}</Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Container>
    )
}