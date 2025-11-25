import { Container, Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from "@mui/material";
import { useFetchOrdersQuery } from "./orderApi"
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { currencyFormat } from "../../lib/util";

export default function OrdersPage() {
    const {data: orders, isLoading} = useFetchOrdersQuery();
    const navigate = useNavigate();

    if (isLoading) return <Typography variant="h5">Loading orders...</Typography>

    if (!orders) return <Typography variant="h5">No orders available</Typography>

    return (
        <Container maxWidth='md'>
            <Typography variant="h6" align="center" gutterBottom sx={{ mb: 1 }}>
                My orders
            </Typography>
            <Box>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Order</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Status</TableCell>
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
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{format(order.orderDate, 'dd MMM yyyy')}</Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{currencyFormat(order.total)}</Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{order.orderStatus}</Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Container>
    )
}