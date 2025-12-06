import { Grid, Typography, Box, Button, CircularProgress } from "@mui/material";
import { Link } from 'react-router-dom';
import { useFetchBasketQuery } from "./basketApi"
import BasketItem from "./BasketItem";
import OrderSummary from "../../app/shared/components/OrderSummary";

export default function BasketPage() {
    const {data, isLoading} = useFetchBasketQuery();

    if (isLoading) return (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: { xs: 6, md: 8 } }}>
            <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={48} />
                <Typography sx={{ mt: 2 }} variant="h6">A carregar carrinho...</Typography>
                <Typography variant="body2" color="text.secondary">Aguarde um momento enquanto recuperamos os seus itens.</Typography>
            </Box>
        </Box>
    )

    if (!data || data.items.length === 0) return (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: { xs: 6, md: 8 } }}>
            <Box sx={{ textAlign: 'center', maxWidth: 560, px: 2 }}>
                <Box sx={{ width: 140, height: 140, mx: 'auto', mb: 2 }}>
                    <Box sx={{ width: '100%', height: '100%', borderRadius: 2, border: '2px dashed', borderColor: 'grey.400', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="64" height="64" aria-hidden="true" focusable="false">
                            <path fill="currentColor" d="M54 55c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.239-5-5 2.24-5 5-5m-19 0c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.239-5-5 2.24-5 5-5m19 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6m-19 0a3 3 0 1 0 0 6 3 3 0 1 0 0-6M16.355 15c1.232 0 2.324.776 2.754 1.933l.06.177 1.381 4.701h45.52c1.895 0 3.269 1.773 2.857 3.61l-.044.171-7.395 25.297a2.94 2.94 0 0 1-2.63 2.105l-.183.006H29.852a2.94 2.94 0 0 1-2.754-1.933l-.06-.176-8.196-27.798-1.591-5.411a.95.95 0 0 0-.776-.674l-.12-.008H12a1 1 0 0 1-.117-1.993L12 15h4.354zm49.715 8.811H21.138l7.817 26.507a.95.95 0 0 0 .776.674l.12.008h28.823a.94.94 0 0 0 .851-.557l.043-.115 7.393-25.29c.165-.581-.22-1.151-.778-1.22l-.114-.007z" />
                        </svg>
                    </Box>
                </Box>

                <Typography variant="h5" component="h2" fontWeight="700" gutterBottom>
                    Carrinho vazio
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Explora o site e descobre as melhores promoções
                </Typography>

                <Button component={Link} to="/catalog" variant="contained" color="primary">
                    Voltar à loja
                </Button>
            </Box>
        </Box>
    )

    return (
        <Grid container spacing={2} sx={{ pt: { xs: 8, md: 10 } }}>
            <Grid item xs={12} md={8}>
                {data.items.map(item => (
                    <BasketItem item={item} key={item.productId} />
                ))}
            </Grid>
            <Grid item xs={12} md={4}>
                <OrderSummary />
            </Grid>
        </Grid>
    )
}