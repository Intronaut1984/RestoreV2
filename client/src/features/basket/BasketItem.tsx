import { Box, IconButton, Paper, Typography } from "@mui/material"
import { Item } from "../../app/models/basket"
import { Add, Close, Remove } from "@mui/icons-material"
import { useAddBasketItemMutation, useRemoveBasketItemMutation } from "./basketApi"
import { currencyFormat, computeFinalPrice } from "../../lib/util"

type Props = {
    item: Item
}

export default function BasketItem({ item }: Props) {
    const [removeBasketItem] = useRemoveBasketItemMutation();
    const [addBasketItem] = useAddBasketItemMutation();

    return (
        <Paper sx={{
            borderRadius: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1.5,
            mb: 2,
            boxSizing: 'border-box'
        }}>
            <Box sx={{display: 'flex', alignItems: 'center', width: '100%'}}>
                <Box
                    component='img'
                    src={item.pictureUrl}
                    alt={item.name}
                    sx={{
                        width: { xs: 72, sm: 100 },
                        height: { xs: 72, sm: 100 },
                        objectFit: 'cover',
                        borderRadius: 1,
                        mr: { xs: 2, sm: 4 },
                        ml: { xs: 0, sm: 2 },
                        flex: '0 0 auto'
                    }}
                />

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0}}>
                    <Typography variant="h6" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Typography>

                    {!!item.variantColor && (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            Cor: {item.variantColor}
                        </Typography>
                    )}

                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                        {item.discountPercentage ? (
                            <>
                                <Typography sx={{fontSize: { xs: '0.95rem', sm: '1.1rem' }, textDecoration: 'line-through', color: 'text.secondary'}}>
                                    {currencyFormat(item.price)} x {item.quantity}
                                </Typography>
                                <Typography sx={{fontSize: { xs: '0.95rem', sm: '1.1rem' }}} color='error'>
                                    {currencyFormat(computeFinalPrice(item.price, item.discountPercentage) * item.quantity)}
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography sx={{fontSize: { xs: '0.95rem', sm: '1.1rem' }}}>
                                    {currencyFormat(item.price)} x {item.quantity}
                                </Typography>
                                <Typography sx={{fontSize: { xs: '0.95rem', sm: '1.1rem' }}} color='primary'>
                                    {currencyFormat(item.price * item.quantity)}
                                </Typography>
                            </>
                        )}
                        
                        {/* If discount present, also show per-unit red final price next to quantity for clarity */}
                        {item.discountPercentage && (
                            <Typography sx={{fontSize: { xs: '0.9rem', sm: '1rem' }}} color='error'>
                                {currencyFormat(computeFinalPrice(item.price, item.discountPercentage))} / unidade
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <IconButton 
                            onClick={() => removeBasketItem({productId: item.productId, variantId: item.productVariantId ?? null, quantity: 1})}
                            color="error" 
                            size="small" 
                            sx={{border: 1, borderRadius: 1, minWidth: 0, p: 0.5}}
                        >
                            <Remove fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" sx={{ mx: 0.5 }}>{item.quantity}</Typography>
                        <IconButton 
                            onClick={() => addBasketItem({product: item, quantity: 1})}
                            color="success" 
                            size="small" 
                            sx={{border: 1, borderRadius: 1, minWidth: 0, p: 0.5}}
                        >
                            <Add fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            <IconButton
                onClick={() => removeBasketItem({productId: item.productId, variantId: item.productVariantId ?? null, quantity: item.quantity})}
                color='error'
                size="small" 
                sx={{
                    border: 1, 
                    borderRadius: 1, 
                    minWidth: 0, 
                    alignSelf: { xs: 'flex-end', sm: 'start' },
                    mt: { xs: 1, sm: 0 },
                    ml: { xs: 0, sm: 1 }
                }}
            >
                <Close fontSize="small" />
            </IconButton>
        </Paper>
    )
}