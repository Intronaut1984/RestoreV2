import { Button, Card, CardActions, CardContent, CardMedia, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Product } from "../../app/models/product";
import { Link } from "react-router-dom";
import { useAddBasketItemMutation } from "../basket/basketApi";
import { currencyFormat } from "../../lib/util";
import { useEffect, useState } from 'react';
import { computeFinalPrice } from '../../lib/util';

type Props = {
    product: Product;
};

export default function ProductCard({ product }: Props) {
    const [addBasketItem, { isLoading }] = useAddBasketItemMutation();
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    const images = [product.pictureUrl, ...(product.secondaryImages ?? [])].filter((x): x is string => !!x);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const id = setInterval(() => setIndex(i => (i + 1) % images.length), 3000);
        return () => clearInterval(id);
    }, [images.length]);

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
            <Box sx={{ position: 'relative' }}>
                <Link to={`/catalog/${product.id}`} style={{ display: 'block' }}>
                    <CardMedia
                        component="img"
                        image={images[index]}
                        alt={product.name}
                        sx={{ width: '100%', height: 'auto', objectFit: 'cover', minHeight: { xs: 100, sm: 140 }, cursor: 'pointer' }}
                    />
                </Link>

                {product.discountPercentage && product.discountPercentage > 0 && (
                    <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'error.main', color: 'common.white', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700, zIndex: 6 }}>
                        {`-${product.discountPercentage}%`}
                    </Box>
                )}
            </Box>

            <CardContent>
                <Typography gutterBottom sx={{ textTransform: 'uppercase' }} variant="subtitle2">
                    {product.name}
                </Typography>

                <Typography variant="h6" sx={{ color: isLight ? 'text.primary' : 'secondary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {product.discountPercentage && product.discountPercentage > 0 ? (
                        <>
                            <span style={{ textDecoration: 'line-through', marginRight: 8 }}>{currencyFormat(product.price)}</span>
                            <span style={{ color: 'crimson', fontWeight: 700 }}>{currencyFormat(computeFinalPrice(product.price, product.discountPercentage))}</span>
                        </>
                    ) : (
                        <span>{currencyFormat(product.price)}</span>
                    )}
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