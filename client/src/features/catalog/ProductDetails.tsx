import { useParams } from "react-router-dom"
import { Button, Divider, Grid2, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography, Box, IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material'
import { currencyFormat, computeFinalPrice } from "../../lib/util";
import { useFetchProductDetailsQuery } from "./catalogApi";
import { useAddBasketItemMutation, useFetchBasketQuery, useRemoveBasketItemMutation } from "../basket/basketApi";
import { ChangeEvent, useEffect, useState } from "react";

export default function ProductDetails() {
  const { id } = useParams();
  const [removeBasketItem] = useRemoveBasketItemMutation();
  const [addBasketItem] = useAddBasketItemMutation();
  const {data: basket} = useFetchBasketQuery();
  const item = basket?.items.find(x => x.productId === +id!);
  const [quantity, setQuantity] = useState(0); 

  useEffect(() => {
    if (item) setQuantity(item.quantity);
  }, [item]);

  const {data: product, isLoading} = useFetchProductDetailsQuery(id ? +id : 0)
  // carousel state: images array and current index
  const images = product ? [product.pictureUrl, ...(product.secondaryImages ?? [])].filter(Boolean) : [];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // reset to first image when product changes
    setCurrent(0);
  }, [product?.id]);

  if (!product || isLoading) return <div>Loading...</div>

  const handleUpdateBasket = () => {
    const updatedQuantity = item ? Math.abs(quantity - item.quantity) : quantity;
    if (!item || quantity > item.quantity) {
      addBasketItem({product, quantity: updatedQuantity})
    } else {
      removeBasketItem({productId: product.id, quantity: updatedQuantity})
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = +event.currentTarget.value;

    if (value >= 0) setQuantity(value)
  }

  const productDetails = [
    { label: 'Nome', value: product.name },
    { label: 'Descrição', value: product.description },
    { label: 'Género', value: product.genero ?? '—' },
    { label: 'Ano de Publicação', value: product.anoPublicacao ?? '—' },
    { label: 'Quantidade em estoque', value: product.quantityInStock },
  ]

  return (
    <Grid2 container spacing={4} sx={{ mx: 'auto', px: { xs: 2, md: 3 }, maxWidth: 1200, justifyContent: 'center' }}>
      <Grid2 size={6} sx={{ width: { xs: '100%', md: '50%' } }}>
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <img
              src={images[current]}
              alt={product.name}
              style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 8 }}
            />

            {images.length > 1 && (
              <>
                <IconButton onClick={() => setCurrent(i => (i - 1 + images.length) % images.length)} size='large' sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)' }}>
                  <ArrowBackIosNew fontSize='small' />
                </IconButton>
                <IconButton onClick={() => setCurrent(i => (i + 1) % images.length)} size='large' sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)' }}>
                  <ArrowForwardIos fontSize='small' />
                </IconButton>
              </>
            )}
          </Box>

          {images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {images.map((img, idx) => (
                <Box key={idx} component='img' src={img} alt={`thumb-${idx}`} onClick={() => setCurrent(idx)} sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', border: idx === current ? '2px solid' : '1px solid', borderColor: idx === current ? 'primary.main' : 'divider' }} />
              ))}
            </Box>
          )}
        </Box>
      </Grid2>
      <Grid2 size={6} sx={{ width: { xs: '100%', md: '50%' } }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' } }}>{product.name}</Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {product.discountPercentage && product.discountPercentage > 0 ? (
            <>
              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>{currencyFormat(product.price)}</Typography>
              <Typography variant="h6" color='error' sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, fontWeight: 700 }}>{currencyFormat(computeFinalPrice(product.price, product.discountPercentage))}</Typography>
              <Typography variant="caption" sx={{ bgcolor: 'error.main', color: 'common.white', px: 0.5, borderRadius: 0.5, ml: 1 }}>{`-${product.discountPercentage}%`}</Typography>
            </>
          ) : (
            <Typography variant="h6" color='secondary' sx={{ fontSize: { xs: '1rem', md: '1.5rem' } }}>{currencyFormat(product.price)}</Typography>
          )}
        </Box>
        <TableContainer>
          <Table sx={{
            '& td': { fontSize: { xs: '0.9rem', md: '1rem' } }
          }}>
            <TableBody>
              {productDetails.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell sx={{fontWeight: 'bold'}}>{detail.label}</TableCell>
                  <TableCell>{detail.value}</TableCell>
                </TableRow>
              ))}

            </TableBody>
          </Table>
        </TableContainer>
        <Grid2 container spacing={2} marginTop={3}>
          <Grid2 size={6} sx={{ width: { xs: '100%', md: '50%' } }}>
            <TextField
              variant="outlined"
              type="number"
              label='Quantity in basket'
              fullWidth
              value={quantity}
              onChange={handleInputChange}
            />
          </Grid2>
          <Grid2 size={6} sx={{ width: { xs: '100%', md: '50%' } }}>
            <Button
              onClick={handleUpdateBasket}
              disabled={quantity === item?.quantity || (!item && quantity === 0)}
              sx={{height: { xs: '48px', md: '55px' }}}
              color="primary"
              size="large"
              variant="contained"
              fullWidth
            >
              {item ? 'Update quantity' : 'Add to basket'}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
    </Grid2>
  )
}
