import { Button, Card, CardActions, CardContent, CardMedia, Typography, Box, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from '@mui/lab';
import { Product } from "../../app/models/product";
import { Link } from "react-router-dom";
import { useAddBasketItemMutation } from "../basket/basketApi";
import { useAddFavoriteMutation, useRemoveFavoriteMutation } from './favoritesApi';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { currencyFormat } from "../../lib/util";
import { useEffect, useState } from 'react';
import { computeFinalPrice } from '../../lib/util';

type Props = {
    product: Product;
};

export default function ProductCard({ product }: Props) {
    const [addBasketItem, { isLoading }] = useAddBasketItemMutation();
    const [addFavorite] = useAddFavoriteMutation();
    const [removeFavorite] = useRemoveFavoriteMutation();
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    const images = [product.pictureUrl, ...(product.secondaryImages ?? [])].filter((x): x is string => !!x);
    const [index, setIndex] = useState(0);
    const [isFav, setIsFav] = useState<boolean>(product.isFavorite ?? false);

    useEffect(() => {
        if (images.length <= 1) return;
        const id = setInterval(() => setIndex(i => (i + 1) % images.length), 3000);
        return () => clearInterval(id);
    }, [images.length]);

    const isLowStock = typeof product.quantityInStock === 'number' && product.quantityInStock > 0 && product.quantityInStock < 5;

    // keep local state in sync when product prop changes
    useEffect(() => { setIsFav(product.isFavorite ?? false); }, [product.isFavorite]);

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

                <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5, zIndex: 6 }}>
                    {product.discountPercentage && product.discountPercentage > 0 && (
                        <Box sx={{ bgcolor: 'error.main', color: 'common.white', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700 }}>
                            {`-${product.discountPercentage}%`}
                        </Box>
                    )}
                    {isLowStock && (
                        <Box sx={{ bgcolor: 'warning.main', color: 'common.white', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.75rem', fontWeight: 800 }}>
                            Produto quase esgotado
                        </Box>
                    )}
                </Box>

                {/* Favorite heart in top-right */}
                <IconButton
                    onClick={async (e) => {
                        e.preventDefault();
                        // optimistic update
                        const next = !isFav;
                        setIsFav(next);
                        try {
                            if (next) await addFavorite(product.id).unwrap();
                            else await removeFavorite(product.id).unwrap();
                        } catch {
                            // rollback on error
                            setIsFav(!next);
                        }
                    }}
                    sx={{ position: 'absolute', top: 6, right: 6, zIndex: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
                >
                    {isFav ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
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
                <LoadingButton
                    loading={isLoading}
                    onClick={() => addBasketItem({ product, quantity: 1 })}
                    variant="contained"
                    color="secondary"
                    sx={{
                        width: { xs: '100%', sm: 'auto' },
                        borderRadius: 999,
                        fontWeight: 800,
                        textTransform: 'none'
                    }}
                >
                    Adicionar ao Cesto
                </LoadingButton>

                <Button
                    component={Link}
                    to={`/catalog/${product.id}`}
                    variant="outlined"
                    color="secondary"
                    sx={{
                        width: { xs: '100%', sm: 'auto' },
                        borderRadius: 999,
                        fontWeight: 800,
                        textTransform: 'none'
                    }}
                >
                    Ver Detalhes
                </Button>
            </CardActions>
        </Card>
    );
}