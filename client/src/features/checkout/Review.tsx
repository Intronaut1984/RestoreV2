import { Box, Divider, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { currencyFormat, computeFinalPrice } from "../../lib/util";
import { ConfirmationToken } from "@stripe/stripe-js";
import { useBasket } from "../../lib/hooks/useBasket";

type Props = {
    confirmationToken: ConfirmationToken | null;
}

export default function Review({confirmationToken}: Props) {
    const {basket, subtotal, productDiscount, couponDiscount, deliveryFee, total} = useBasket();

    const addressString = () => {
        if (!confirmationToken?.shipping) return '';
        const {name, address} = confirmationToken.shipping;
        return `${name}, ${address?.line1}, ${address?.city}, ${address?.state}, 
            ${address?.postal_code}, ${address?.country}`
    }

    const paymentString = () => {
        if (!confirmationToken?.payment_method_preview.card) return '';
        const {card} = confirmationToken.payment_method_preview;

        return `${card.brand.toUpperCase()}, **** **** **** ${card.last4}, 
            Exp: ${card.exp_month}/${card.exp_year}`
    }

    return (
        <div>
            <Box mt={4} width='100%'>
                <Typography variant="h6" fontWeight='bold'>
                    Billing and delivery information
                </Typography>
                <dl>
                    <Typography component='dt' fontWeight='medium'>
                        Shipping address
                    </Typography>
                    <Typography component='dd' mt={1} color='textSecondary'>
                        {addressString()}
                    </Typography>

                    <Typography component='dt' fontWeight='medium'>
                        Payment details
                    </Typography>
                    <Typography component='dd' mt={1} color='textSecondary'>
                        {paymentString()}
                    </Typography>
                </dl>
            </Box>

            <Box mt={6} mx='auto'>
                <Divider />
                <TableContainer>
                    <Table>
                        <TableBody>
                            {basket?.items.map((item) => (
                                        <TableRow key={item.productId} sx={{borderBottom: '1px solid rgba(224, 224, 224, 1)'}}> 
                                                <TableCell sx={{py: 2}}>
                                                    <Box display='flex' gap={2} alignItems='center'>
                                                        <img src={item.pictureUrl} 
                                                            alt={item.name} 
                                                            style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}} 
                                                        />
                                                        <Typography sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.name}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{p: 2, width: 80}}>
                                                    x {item.quantity}
                                                </TableCell>
                                                <TableCell align="right" sx={{p: 2, width: 120}}>
                                                    {item.discountPercentage ? (
                                                        <Box>
                                                            <Typography sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                                                {currencyFormat(item.price)}
                                                            </Typography>
                                                            <Typography color='error'>
                                                                {currencyFormat(computeFinalPrice(item.price, item.discountPercentage) * item.quantity)}
                                                            </Typography>
                                                            <Typography variant='caption' color='error' display='block'>
                                                                {currencyFormat(computeFinalPrice(item.price, item.discountPercentage))} / unidade
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography>
                                                            {currencyFormat(item.price)}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={2} display='flex' justifyContent='flex-end'>
                    <Box sx={{ width: 320, p: 2 }}>
                        <Box display='flex' justifyContent='space-between' mb={1}>
                            <Typography variant='body2' color='textSecondary'>Subtotal</Typography>
                            <Typography variant='body2'>{currencyFormat(subtotal)}</Typography>
                        </Box>

                        <Box display='flex' justifyContent='space-between' mb={1}>
                            <Typography variant='body2' color='textSecondary'>Product discounts</Typography>
                            <Typography variant='body2' color='error'>- {currencyFormat(productDiscount)}</Typography>
                        </Box>

                        <Box display='flex' justifyContent='space-between' mb={1}>
                            <Typography variant='body2' color='textSecondary'>Coupon</Typography>
                            <Typography variant='body2' color='error'>- {currencyFormat(couponDiscount)}</Typography>
                        </Box>

                        <Box display='flex' justifyContent='space-between' mb={1}>
                            <Typography variant='body2' color='textSecondary'>Delivery</Typography>
                            <Typography variant='body2'>{currencyFormat(deliveryFee)}</Typography>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                            <Typography variant='h6'>Total</Typography>
                            <Typography variant='h6'>{currencyFormat(total)}</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </div>
    )
}