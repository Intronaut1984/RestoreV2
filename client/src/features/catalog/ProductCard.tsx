import { Button, Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Product } from "../../app/models/product";
import { Link } from "react-router-dom";
import { useAddBasketItemMutation } from "../basket/basketApi";
import { currencyFormat } from "../../lib/util";

type Props = {
    product: Product;
};

export default function ProductCard({ product }: Props) {
    const [addBasketItem, { isLoading }] = useAddBasketItemMutation();
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';

    return (
        <Card
            elevation={3}
            sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: 260 },
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: isLight ? 'grey.50' : undefined,
                border: isLight ? '1px solid' : undefined,
                borderColor: isLight ? 'divider' : undefined,
            }}
        >
            <CardMedia
                component="img"
                image={product.pictureUrl}
                alt={product.name}
                sx={{ width: '100%', height: 'auto', objectFit: 'cover', minHeight: { xs: 100, sm: 140 } }}
            />

            <CardContent>
                <Typography gutterBottom sx={{ textTransform: 'uppercase' }} variant="subtitle2">
                    {product.name}
                </Typography>

                <Typography variant="h6" sx={{ color: isLight ? 'text.primary' : 'secondary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {currencyFormat(product.price)}
                </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                <Button
                    disabled={isLoading}
                    onClick={() => addBasketItem({ product, quantity: 1 })}
                    sx={{ color: isLight ? 'text.primary' : undefined, width: { xs: '100%', sm: 'auto' } }}
                >
                    Add to cart
                </Button>

                <Button component={Link} to={`/catalog/${product.id}`} sx={{ color: isLight ? 'text.primary' : undefined, width: { xs: '100%', sm: 'auto' } }}>
                    View
                </Button>
            </CardActions>
        </Card>
    );
}