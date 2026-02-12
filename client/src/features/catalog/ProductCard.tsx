import { Button, Card, CardActions, CardContent, CardMedia, Typography, Box, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from '@mui/lab';
import { Product } from "../../app/models/product";
import { Link, useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    const accentColor: 'warning' | 'secondary' = isLight ? 'warning' : 'secondary';
    const images = [product.pictureUrl, ...(product.secondaryImages ?? [])].filter((x): x is string => !!x);
    const [index, setIndex] = useState(0);
    const [isFav, setIsFav] = useState<boolean>(product.isFavorite ?? false);

    const resolveDotBg = (colorName: string | null | undefined) => {
        const n = (colorName ?? '').trim().toLowerCase();
        if (!n) return theme.palette.grey[400];

        if (n.startsWith('#') || n.startsWith('rgb') || n.startsWith('hsl')) return colorName as string;
        if (n === 'branco' || n === 'white') return theme.palette.common.white;
        if (n === 'preto' || n === 'black') return theme.palette.common.black;
        if (n === 'cinzento' || n === 'cinza' || n === 'gray' || n === 'grey') return theme.palette.grey[600];
        if (n === 'vermelho' || n === 'red') return theme.palette.error.main;
        if (n === 'azul' || n === 'blue') return theme.palette.primary.main;
        if (n === 'verde' || n === 'green') return theme.palette.success.main;
        if (n === 'amarelo' || n === 'yellow') return theme.palette.warning.main;
        if (n === 'laranja' || n === 'orange') return theme.palette.warning.dark;
        if (n === 'rosa' || n === 'pink') return theme.palette.secondary.main;
        if (n === 'roxo' || n === 'purple') return theme.palette.secondary.dark;
        return theme.palette.grey[400];
    };

    const colorOptions = (() => {
        const options: Array<{ kind: 'base' | 'variant'; color: string; variantId?: number; inStock?: boolean }> = [];

        const baseColor = (product.cor ?? '').trim();
        if (baseColor) options.push({ kind: 'base', color: baseColor });

        const variants = (product.variants ?? [])
            .filter(v => !!v && typeof v.color === 'string' && v.color.trim().length > 0)
            .map(v => ({
                kind: 'variant' as const,
                color: v.color.trim(),
                variantId: v.id,
                inStock: typeof v.quantityInStock === 'number' ? v.quantityInStock > 0 : true
            }));

        options.push(...variants);

        const seen = new Set<string>();
        return options.filter(o => {
            const k = o.color.toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    })();

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

                {colorOptions.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                        {colorOptions.map((opt) => (
                            <Box
                                key={opt.kind === 'variant' ? `v-${opt.variantId}` : `b-${opt.color}`}
                                aria-label={`Cor ${opt.color}`}
                                title={opt.color}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    if (opt.kind === 'variant') {
                                        if (opt.inStock === false) return;
                                        navigate(`/catalog/${product.id}?variantId=${opt.variantId}`);
                                    } else {
                                        navigate(`/catalog/${product.id}`);
                                    }
                                }}
                                sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: resolveDotBg(opt.color),
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    cursor: opt.kind === 'variant' && opt.inStock === false ? 'not-allowed' : 'pointer',
                                    opacity: opt.kind === 'variant' && opt.inStock === false ? 0.5 : 1,
                                    boxSizing: 'border-box'
                                }}
                            />
                        ))}
                    </Box>
                )}

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
                    color={accentColor}
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
                    color={accentColor}
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