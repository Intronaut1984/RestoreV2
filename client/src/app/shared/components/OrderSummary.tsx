import { Box, Typography, Divider, Button, TextField, Paper, useTheme } from "@mui/material";
import { currencyFormat } from "../../../lib/util";
import { Link, useLocation } from "react-router-dom";
import { useBasket } from "../../../lib/hooks/useBasket";
import { FieldValues, useForm } from "react-hook-form";
import { LoadingButton } from "@mui/lab";
import { useAddCouponMutation, useRemoveCouponMutation } from "../../../features/basket/basketApi";
import { Delete } from "@mui/icons-material";

export default function OrderSummary() {
    const theme = useTheme();
    const {subtotal, deliveryFee, discount, basket, total} = useBasket();
    // If the primary color is very light (low contrast on white paper), use outlined buttons
    // so they remain visible in light mode. We check MUI's contrast helper.
    const primaryContrastText = theme.palette.getContrastText(theme.palette.primary.main);
    const primaryIsLight = primaryContrastText === theme.palette.common.black;
    const buttonVariant: 'contained' | 'outlined' = primaryIsLight ? 'outlined' : 'contained';
    // Force a dark filled Checkout button for light mode so it is always visible on white Paper.
    const checkoutUsesDarkFill = theme.palette.mode === 'light';
    const checkoutVariant: 'contained' | 'outlined' = checkoutUsesDarkFill ? 'contained' : buttonVariant;
    const checkoutSx = checkoutUsesDarkFill
        ? { bgcolor: `${theme.palette.grey[900]} !important`, color: `${theme.palette.common.white} !important`, '&:hover': { bgcolor: `${theme.palette.grey[800]} !important` }, boxShadow: 'none' }
        : (buttonVariant === 'contained' ? { color: theme.palette.getContrastText(theme.palette.primary.main) } : {});
    const location = useLocation();
    const {register, handleSubmit, formState: {isSubmitting}} = useForm();
    const [addCoupon] = useAddCouponMutation();
    const [removeCoupon, {isLoading}] = useRemoveCouponMutation();

    const onSubmit = async (data: FieldValues) => {
            await addCoupon(data.code);
    } 

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ mb: 2, p: { xs: 2, sm: 3 }, width: '100%', borderRadius: 3, boxSizing: 'border-box' }}>

                <Typography variant="h6" component="p" fontWeight="bold">
                    Carrinho
                </Typography>
                <Box mt={2}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 1, gap: 1, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                        <Typography color="textSecondary" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Subtotal</Typography>
                        <Typography sx={{ flex: '0 0 auto', ml: { xs: 0, sm: 1 }, mt: { xs: 0.5, sm: 0 } }}>
                            {currencyFormat(subtotal)}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 1, gap: 1, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                        <Typography color="textSecondary" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Desconto</Typography>
                        <Typography color="success" sx={{ flex: '0 0 auto', ml: { xs: 0, sm: 1 }, mt: { xs: 0.5, sm: 0 } }}>
                            -{currencyFormat(discount)}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 1, gap: 1, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                        <Typography color="textSecondary" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Taxa de entrega</Typography>
                        <Typography sx={{ flex: '0 0 auto', ml: { xs: 0, sm: 1 }, mt: { xs: 0.5, sm: 0 } }}>
                            {currencyFormat(deliveryFee)}
                        </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 1, gap: 1, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                        <Typography color="textSecondary" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Total</Typography>
                        <Typography sx={{ flex: '0 0 auto', ml: { xs: 0, sm: 1 }, mt: { xs: 0.5, sm: 0 }, fontWeight: 'bold' }}>
                            {currencyFormat(total)}
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{fontStyle: 'italic', fontSize: { xs: '0.65rem', sm: '0.8rem' }, mt: 1}}>
                    *Entrega Gratuita em compras mais de €50
                    </Typography>
                </Box>

                <Box mt={2} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'column' }, gap: 1 }}>
                    {!location.pathname.includes('checkout') &&
                    <Button
                        component={Link}
                        to='/checkout'
                        variant={checkoutVariant}
                        {...(!checkoutUsesDarkFill ? { color: 'primary' } : {})}
                        fullWidth
                        disableElevation={checkoutUsesDarkFill}
                        sx={checkoutSx}
                    >
                        Comprar
                    </Button>}
                    <Button
                        component={Link}
                        to='/catalog'
                        variant={buttonVariant}
                        color="primary"
                        fullWidth
                        sx={buttonVariant === 'contained' ? { color: theme.palette.getContrastText(theme.palette.primary.main) } : {}}
                    >
                        Voltar à Loja
                    </Button>
                </Box>
            </Paper>

            {/* Coupon Code Section */}
            {location.pathname.includes('checkout') &&
            <Paper sx={{ width: '100%', borderRadius: 3, p: { xs: 2, sm: 3 }, mt: 2, boxSizing: 'border-box' }}>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Typography variant="subtitle1" component="label">
                        Do you have a voucher code?
                    </Typography>

                    {basket?.coupon &&
                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                        <Typography fontWeight='bold' variant='body2' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{basket.coupon.name} applied</Typography>
                        <LoadingButton loading={isLoading} onClick={() => removeCoupon()} size="small" sx={{ ml: 'auto' }}>
                            <Delete color="error" />
                        </LoadingButton>
                    </Box>}

                    <TextField
                        label="Voucher code"
                        variant="outlined"
                        fullWidth
                        disabled={!!basket?.coupon}
                        {...register('code', {required: 'Voucher code missing'})}
                        sx={{ my: 2 }}
                    />

                    <LoadingButton
                        loading={isSubmitting}
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={!!basket?.coupon}
                    >
                        Apply code
                    </LoadingButton>
                </form>
            </Paper>}
        </Box>
    )
}