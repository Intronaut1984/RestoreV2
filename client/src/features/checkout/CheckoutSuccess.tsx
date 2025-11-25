import { Box, Button, Container, Divider, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { Order } from "../../app/models/order";
import { currencyFormat, formatAddressString, formatPaymentString } from "../../lib/util";
import { format } from 'date-fns';

export default function CheckoutSuccess() {
  const { state } = useLocation();
  const order = state.data as Order;

  if (!order) return <Typography>Problem accessing the order</Typography>

  return (
    <Container maxWidth='md'>
      <Typography variant="h4" gutterBottom fontWeight='bold' sx={{ mb: 1 }}>
        Thanks for your fake order!
      </Typography>

      <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
        Your order <strong>#{order.id}</strong> will never be processed as this is a fake shop.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Order date</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{format(new Date(order.orderDate), 'dd MMM yyyy')}</Box>
        </Box>

        <Divider />

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Payment method</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{formatPaymentString(order.paymentSummary)}</Box>
        </Box>

        <Divider />

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Shipping address</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block', maxWidth: '60%', textAlign: 'right' }}>{formatAddressString(order.shippingAddress)}</Box>
        </Box>

        <Divider />

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Amount</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{currencyFormat(order.total)}</Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button variant="contained" color="primary" component={Link} to={`/orders/${order.id}`} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          View your order
        </Button>
        <Button component={Link} to='/catalog' variant="outlined" color='primary' sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Continue shopping
        </Button>
      </Box>
    </Container>
  )
}