import { Button, Card, CardActions, CardContent, CardMedia, Typography, useTheme } from "@mui/material"
import { Product } from "../../app/models/product"
import { Link } from "react-router-dom"
import { useAddBasketItemMutation } from "../basket/basketApi"
import { currencyFormat } from "../../lib/util"

type Props = {
    product: Product
}

export default function ProductCard({ product }: Props) {
    const [addBasketItem, {isLoading}] = useAddBasketItemMutation();
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    return (
        <Card
            elevation={3}
            sx={{
                width: '100%',
                maxWidth: 260,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            <CardMedia
                component="img"
                image={product.pictureUrl}
                alt={product.name}
                sx={{ width: '100%', height: 'auto', objectFit: 'cover', minHeight: 140 }}
            />
            <CardContent>
                <Typography
                    gutterBottom
                    sx={{ textTransform: 'uppercase' }}
                    variant="subtitle2">
                    {product.name}
                </Typography>
                <Typography
                    variant="h6"
                    sx={{ color: isLight ? 'text.primary' : 'secondary.main' }}
                >
                    {currencyFormat(product.price)}
                </Typography>
            </CardContent>
            <CardActions
                sx={{ justifyContent: 'space-between' }}
            >
                <Button 
                    disabled={isLoading}
                    onClick={() => addBasketItem({product, quantity: 1})}
                    sx={{ color: isLight ? 'text.primary' : undefined }}
                >Add to cart</Button>
                <Button component={Link} to={`/catalog/${product.id}`} sx={{ color: isLight ? 'text.primary' : undefined }}>View</Button>
            </CardActions>
        </Card>
    )
}