import { Link, useParams } from "react-router-dom"
import { Button, Divider, Grid2, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography, Box, IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material'
import { currencyFormat, computeFinalPrice } from "../../lib/util";
import { useFetchProductDetailsQuery, useFetchProductsQuery, useRecordProductClickMutation } from "./catalogApi";
import { useAddBasketItemMutation, useFetchBasketQuery, useRemoveBasketItemMutation } from "../basket/basketApi";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useCookieConsent } from "../../app/layout/cookieConsent";
import { skipToken } from "@reduxjs/toolkit/query";
import { ProductParams } from "../../app/models/productParams";
import { Product } from "../../app/models/product";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ProductDetails() {
  const { id } = useParams();
  const [recordClick] = useRecordProductClickMutation();
  const { analyticsAllowed } = useCookieConsent();
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

  useEffect(() => {
    if (!analyticsAllowed) return;

    const productId = id ? +id : 0;
    if (!productId) return;

    const key = 'restore_session_id';
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(key, sessionId);
    }

    // Fire and forget (dedupe is enforced server-side).
    recordClick({ productId, sessionId }).catch(() => undefined);
  }, [id, recordClick, analyticsAllowed]);

  if (!product || isLoading) return <div>Loading...</div>

  const baseProductParams: ProductParams = {
    pageNumber: 1,
    pageSize: 8,
    anos: [],
    generos: [],
    categoryIds: [],
    campaignIds: [],
    marcas: [],
    modelos: [],
    tipos: [],
    capacidades: [],
    cores: [],
    materiais: [],
    tamanhos: [],
    hasDiscount: undefined,
    searchTerm: '',
    orderBy: 'name'
  };

  const primaryCategoryId = product.categories?.[0]?.id;

  const similarParams = useMemo<ProductParams | typeof skipToken>(() => {
    if (!primaryCategoryId) return skipToken;
    return {
      ...baseProductParams,
      pageNumber: 1,
      pageSize: 24,
      orderBy: 'name',
      categoryIds: [primaryCategoryId]
    };
  }, [primaryCategoryId]);

  const { data: similarData, isLoading: similarLoading } = useFetchProductsQuery(similarParams);

  const similarProducts = useMemo(() => {
    const items = (similarData?.items ?? []).filter(p => p.id !== product.id);
    return shuffle(items).slice(0, 16);
  }, [similarData?.items, product.id]);

  const [similarPage, setSimilarPage] = useState(0);
  useEffect(() => {
    setSimilarPage(0);
  }, [primaryCategoryId]);

  useEffect(() => {
    if (!similarProducts.length) return;
    const id = setInterval(() => {
      setSimilarPage(p => (p + 1) % Math.ceil(similarProducts.length / 4));
    }, 5000);
    return () => clearInterval(id);
  }, [similarProducts.length]);

  const visibleSimilar = useMemo(() => {
    if (!similarProducts.length) return [] as Product[];
    const start = (similarPage * 4) % similarProducts.length;
    const slice = similarProducts.slice(start, start + 4);
    if (slice.length === 4) return slice;
    return slice.concat(similarProducts.slice(0, 4 - slice.length));
  }, [similarProducts, similarPage]);

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

  const productDetails: Array<{ label: string; value: string }> = [];

  const pushIfValue = (label: string, value: unknown) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (Array.isArray(value) && value.length === 0) return;

    if (Array.isArray(value)) {
      productDetails.push({ label, value: value.join(', ') });
      return;
    }

    productDetails.push({ label, value: String(value) });
  };

  // Base fields (always relevant)
  pushIfValue('Nome', product.name);
  pushIfValue('Descrição', product.description ?? product.synopsis);
  pushIfValue('Subtítulo', product.subtitle);
  pushIfValue('Preço', currencyFormat(product.price));
  if (product.promotionalPrice) pushIfValue('Preço Promocional', currencyFormat(product.promotionalPrice));
  if (product.discountPercentage != null) pushIfValue('Desconto (%)', product.discountPercentage);
  pushIfValue('Quantidade em stock', product.quantityInStock);

  const isBook = (p: typeof product) => {
    return (p.categories ?? []).some(c => (c?.name ?? '').toLowerCase().includes('livro'))
  }

  const isClothing = (p: typeof product) => {
    return (p.categories ?? []).some(c => {
      const n = (c?.name ?? '').toLowerCase();
      return ['vestuario', 'vestuário', 'roupa', 'roupas'].some(k => n.includes(k));
    })
  }

  const isToy = (p: typeof product) => {
    return (p.categories ?? []).some(c => {
      const n = (c?.name ?? '').toLowerCase();
      return ['brinquedo', 'brinquedos', 'toy', 'toys'].some(k => n.includes(k));
    })
  }

  const isTechnology = (p: typeof product) => {
    return (p.categories ?? []).some(c => {
      const n = (c?.name ?? '').toLowerCase();
      return ['tecnologia', 'tecnológico', 'tecnologicos', 'tech', 'eletronica', 'eletrónica', 'electronica', 'electronics', 'eletrónicos'].some(k => n.includes(k));
    })
  }

  if (isBook(product)) {
    pushIfValue('Autor', product.author);
    pushIfValue('Autores Secundários', product.secondaryAuthors);
    pushIfValue('ISBN', product.isbn);
    pushIfValue('Editora', product.publisher);
    pushIfValue('Edição', product.edition);
    pushIfValue('Género', product.genero);
    pushIfValue('Ano de Publicação', product.anoPublicacao);
    pushIfValue('Índice', product.index);
    pushIfValue('Número de páginas', product.pageCount);
    pushIfValue('Idioma', product.language);
    pushIfValue('Formato', product.format);
    pushIfValue('Dimensões', product.dimensoes);
    pushIfValue('Peso (g)', product.weight);
  }

  if (isClothing(product)) {
    pushIfValue('Marca / Brand', product.marca);
    pushIfValue('Tamanho / Size', product.tamanho);
    pushIfValue('Cor / Color', product.cor);
    pushIfValue('Material / Tecido', product.material);
  }

  if (isTechnology(product)) {
    pushIfValue('Tipo', product.tipo);
    pushIfValue('Marca / Brand', product.marca);
    pushIfValue('Modelo', product.modelo);
    pushIfValue('Capacidade', product.capacidade);
    pushIfValue('Cor / Color', product.cor);
    pushIfValue('Material', product.material);
  }

  if (isToy(product)) {
    pushIfValue('Marca / Brand', product.marca);
    pushIfValue('Cor / Color', product.cor);
    pushIfValue('Material', product.material);
    pushIfValue('Idade mínima', product.idadeMinima);
    pushIfValue('Idade máxima', product.idadeMaxima);
  }

  // always include categories and campaigns if present
  if (product.categories && product.categories.length) {
    pushIfValue('Categorias', product.categories.map(c => c.name));
  }

  if (product.campaigns && product.campaigns.length) {
    pushIfValue('Campaigns', product.campaigns.map(c => c.name));
  }

  // metadata
  pushIfValue('Criado em', product.createdAt);
  pushIfValue('Atualizado em', product.updatedAt);

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

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            Artigos semelhantes
          </Typography>

          {similarLoading && (
            <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
              A carregar...
            </Typography>
          )}

          {!similarLoading && !visibleSimilar.length && (
            <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
              Sem artigos semelhantes para mostrar.
            </Typography>
          )}

          {!!visibleSimilar.length && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                gap: 1,
              }}
            >
              {visibleSimilar.map(p => {
                const hasDiscount = !!p.discountPercentage && p.discountPercentage > 0;
                const finalPrice = computeFinalPrice(p.price, p.discountPercentage, p.promotionalPrice);

                return (
                  <Box
                    key={p.id}
                    component={Link}
                    to={`/catalog/${p.id}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      '&:hover': { boxShadow: 2, transform: 'translateY(-1px)' },
                      transition: 'all 160ms ease',
                      display: 'block',
                    }}
                  >
                    <Box
                      sx={{
                        aspectRatio: '1 / 1',
                        backgroundImage: `url(${p.pictureUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <Box sx={{ p: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.15 }}>
                        {p.name}
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        {hasDiscount && (
                          <Typography sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.75rem' }}>
                            {currencyFormat(p.price)}
                          </Typography>
                        )}
                        <Typography sx={{ fontWeight: 900, fontSize: '0.85rem' }}>
                          {currencyFormat(finalPrice)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
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
              label='Quantidade no Cesto'
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
              {item ? 'Atualizar' : 'Adicionar ao carrinho'}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
    </Grid2>
  )
}
