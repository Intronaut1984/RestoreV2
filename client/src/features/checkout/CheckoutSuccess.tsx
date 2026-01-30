import { Box, Button, Container, Divider, Typography, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { Order } from "../../app/models/order";
import { currencyFormat, formatAddressString, formatPaymentString, formatOrderAmount } from "../../lib/util";
import { format } from 'date-fns';
import { primaryActionSx, secondaryActionSx } from "../../app/shared/styles/actionButtons";

export default function CheckoutSuccess() {
  const theme = useTheme();
  const { state } = useLocation();
  const order = state?.data as Order | undefined;
  const productDiscount = (order?.productDiscount ?? state?.productDiscount ?? 0) as number;
  const couponDiscount = (order?.discount ?? state?.couponDiscount ?? 0) as number;
  const totalDiscount = productDiscount + couponDiscount;

  if (!order) return <Typography>Problema ao aceder à encomenda</Typography>

  return (
    <Container maxWidth='md'>
      <Typography variant="h4" gutterBottom fontWeight='bold' sx={{ mb: 1 }}>
        Obrigado pela sua compra!
      </Typography>

      <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
        Seu pedido <strong>#{order.id}</strong> nunca será processado, pois esta é uma loja falsa.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Data de Compra</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{format(new Date(order.orderDate), 'dd MMM yyyy')}</Box>
        </Box>

        <Divider />

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Método de pagamento</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{formatPaymentString(order.paymentSummary)}</Box>
        </Box>

        <Divider />

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Endereço de entrega</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block', maxWidth: '60%', textAlign: 'right' }}>{formatAddressString(order.shippingAddress)}</Box>
        </Box>

        <Divider />

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Desconto</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block', maxWidth: '60%', textAlign: 'right' }}>{currencyFormat(totalDiscount)}</Box>
        </Box>

        <Divider />

        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Valor</Typography>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{formatOrderAmount(order.total)}</Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          variant="contained"
          component={Link}
          to={`/orders/${order.id}`}
          sx={{ width: { xs: '100%', sm: 'auto' }, ...primaryActionSx(theme) }}
          disableElevation
        >
          Ver Compra
        </Button>
        <Button
          component={Link}
          to='/catalog'
          variant="outlined"
          sx={{ width: { xs: '100%', sm: 'auto' }, ...secondaryActionSx(theme) }}
        >
          Voltar à Loja
        </Button>
      </Box>
    </Container>
  )
}