import { Link, useParams } from "react-router-dom"
import { Button, Divider, Grid2, Rating, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography, Box, IconButton, useTheme } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material'
import { currencyFormat, computeFinalPrice } from "../../lib/util";
import { useCreateProductReviewMutation, useFetchProductDetailsQuery, useFetchProductReviewsQuery, useFetchProductsQuery, useRecordProductClickMutation, useReplyProductReviewMutation } from "./catalogApi";
import { useAddBasketItemMutation, useFetchBasketQuery, useRemoveBasketItemMutation } from "../basket/basketApi";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useCookieConsent } from "../../app/layout/cookieConsent";
import { skipToken } from "@reduxjs/toolkit/query";
import { ProductParams } from "../../app/models/productParams";
import { Product } from "../../app/models/product";
import { useUserInfoQuery } from "../account/accountApi";

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
  const theme = useTheme();
  const { data: user } = useUserInfoQuery();
  const [recordClick] = useRecordProductClickMutation();
  const { analyticsAllowed } = useCookieConsent();
  const [removeBasketItem] = useRemoveBasketItemMutation();
  const [addBasketItem] = useAddBasketItemMutation();
  const {data: basket} = useFetchBasketQuery();
  const productId = id ? +id : 0;
  const item = basket?.items.find(x => x.productId === productId);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(item?.quantity ?? 1);
  }, [item]);

  const {data: product, isLoading} = useFetchProductDetailsQuery(productId)
  const { data: reviews = [], isLoading: reviewsLoading } = useFetchProductReviewsQuery(productId);
  const [createReview, { isLoading: isSubmittingReview }] = useCreateProductReviewMutation();
  const [replyReview, { isLoading: isReplyingReview }] = useReplyProductReviewMutation();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const isAdmin = user?.roles?.includes('Admin') ?? false;
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminReplyError, setAdminReplyError] = useState<string | null>(null);
  const [adminReplySaved, setAdminReplySaved] = useState(false);

  const primaryCategoryId = product?.categories?.[0]?.id ?? null;

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

  const currentProductId = product?.id;

  const similarProducts = useMemo(() => {
    if (!currentProductId) return [] as Product[];
    const items = (similarData?.items ?? []).filter(p => p.id !== currentProductId);
    return shuffle(items).slice(0, 16);
  }, [similarData?.items, currentProductId]);

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

  // carousel state: images array and current index
  const images = product ? [product.pictureUrl, ...(product.secondaryImages ?? [])].filter(Boolean) : [];
  const [current, setCurrent] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // reset to first image when product changes
    setCurrent(0);
  }, [product?.id]);

  useEffect(() => {
    if (!analyticsAllowed) return;
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
  }, [productId, recordClick, analyticsAllowed]);

  if (!product || isLoading) return <div>Loading...</div>

  const ratingValue = typeof product.averageRating === 'number' ? product.averageRating : 0;
  const ratingsCount = typeof product.ratingsCount === 'number' ? product.ratingsCount : 0;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  const isLight = theme.palette.mode === 'light';
  const accentColor: 'warning' | 'secondary' = isLight ? 'warning' : 'secondary';

  const actionButtonSx = {
    height: { xs: '48px', md: '55px' },
    borderRadius: 999,
    fontWeight: 800,
    textTransform: 'none'
  };

  const handleAddToBasket = () => {
    const qtyToAdd = item ? 1 : quantity;
    if (qtyToAdd <= 0) return;
    addBasketItem({ product, quantity: qtyToAdd });
  };

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

  const isLowStock = typeof product.quantityInStock === 'number' && product.quantityInStock > 0 && product.quantityInStock < 5;

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

  const handleZoomMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const scrollThumbsBy = (delta: number) => {
    const el = thumbsRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <Grid2 container spacing={4} sx={{ mx: 'auto', px: { xs: 2, md: 3 }, maxWidth: 1200, justifyContent: 'center' }}>
      <Grid2 size={{ xs: 12, md: 6 }}>
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, cursor: { xs: 'default', md: 'zoom-in' } }}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleZoomMove}
          >
            <img
              src={images[current]}
              alt={product.name}
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                borderRadius: 8,
                transform: isZoomed ? 'scale(2)' : 'scale(1)',
                transformOrigin: zoomOrigin,
                transition: 'transform 80ms ease-out',
                willChange: 'transform'
              }}
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
            <Box sx={{ position: 'relative', mt: 1, maxWidth: '100%' }}>
              {/* Thumbnails scroller */}
              <Box
                ref={thumbsRef}
                sx={{
                  display: 'flex',
                  gap: 1,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  maxWidth: '100%',
                  pb: 0.5,
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999 },
                }}
              >
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    component='img'
                    src={img}
                    alt={`thumb-${idx}`}
                    onClick={() => setCurrent(idx)}
                    sx={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: idx === current ? '2px solid' : '1px solid',
                      borderColor: idx === current ? 'primary.main' : 'divider',
                      flex: '0 0 auto'
                    }}
                  />
                ))}
              </Box>

              {/* Scroll controls (only useful when there are many thumbs) */}
              {images.length > 5 && (
                <>
                  <IconButton
                    onClick={() => scrollThumbsBy(-220)}
                    size='small'
                    sx={{
                      position: 'absolute',
                      left: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0,0,0,0.35)',
                      color: 'common.white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                    }}
                    aria-label='miniaturas anteriores'
                  >
                    <ArrowBackIosNew fontSize='inherit' />
                  </IconButton>
                  <IconButton
                    onClick={() => scrollThumbsBy(220)}
                    size='small'
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0,0,0,0.35)',
                      color: 'common.white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                    }}
                    aria-label='miniaturas seguintes'
                  >
                    <ArrowForwardIos fontSize='inherit' />
                  </IconButton>
                </>
              )}
            </Box>
          )}
        </Box>
      </Grid2>
      <Grid2 size={{ xs: 12, md: 6 }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' } }}>{product.name}</Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Rating value={ratingValue} precision={0.1} readOnly />
          <Typography variant="body2" color="text.secondary">
            {ratingsCount > 0 ? `${ratingValue.toFixed(1)} (${ratingsCount})` : 'Sem avaliações'}
          </Typography>
        </Box>

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

          {isLowStock && (
            <Typography
              variant="caption"
              sx={{ bgcolor: 'warning.main', color: 'common.white', px: 0.75, borderRadius: 0.5, fontWeight: 800 }}
            >
              Produto quase esgotado
            </Typography>
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
            <Grid2 size={{ xs: 12, md: 4 }} sx={{ width: { xs: '100%', md: '33.333%' } }}>
            <TextField
              variant="outlined"
              type="number"
                label={item ? 'Quantidade no carrinho' : 'Quantidade a adicionar'}
              fullWidth
              value={quantity}
              onChange={handleInputChange}
            />
          </Grid2>
            <Grid2 size={{ xs: 12, md: 4 }} sx={{ width: { xs: '100%', md: '33.333%' } }}>
            <Button
                onClick={handleAddToBasket}
                disabled={!item && quantity <= 0}
                sx={actionButtonSx}
              color={accentColor}
              size="large"
              variant="contained"
              fullWidth
            >
                Adicionar ao carrinho
            </Button>
          </Grid2>

            {item && (
              <Grid2 size={{ xs: 12, md: 4 }} sx={{ width: { xs: '100%', md: '33.333%' } }}>
                <Button
                  onClick={handleUpdateBasket}
                  disabled={quantity === item.quantity}
                  sx={{
                    ...actionButtonSx,
                    bgcolor: isLight ? 'warning.dark' : 'secondary.dark',
                    '&:hover': { bgcolor: isLight ? 'warning.main' : 'secondary.main' }
                  }}
                  color={accentColor}
                  size="large"
                  variant="contained"
                  fullWidth
                >
                  Atualizar quantidade
                </Button>
              </Grid2>
            )}
        </Grid2>
      </Grid2>

      <Grid2 size={12}>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            Avaliações
          </Typography>

          {reviewsLoading ? (
            <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
              A carregar...
            </Typography>
          ) : reviews.length === 0 ? (
            <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
              Sem avaliações.
            </Typography>
          ) : (
            <>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {visibleReviews.map((r) => (
                  <Box key={r.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Rating value={r.rating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {r.buyerEmail}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {r.comment}
                    </Typography>

                    {!!r.adminReply && (
                      <Box sx={{ mt: 1, border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          Resposta da loja
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {r.adminReply}
                        </Typography>
                      </Box>
                    )}

                    {isAdmin && (
                      <Box sx={{ mt: 1 }}>
                        {replyingReviewId !== r.id ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setAdminReplySaved(false);
                                setAdminReplyError(null);
                                setReplyingReviewId(r.id);
                                setAdminReplyText(r.adminReply ?? '');
                              }}
                            >
                              {r.adminReply ? 'Editar resposta' : 'Responder'}
                            </Button>
                          </Box>
                        ) : (
                          <>
                            <TextField
                              value={adminReplyText}
                              onChange={(e) => {
                                setAdminReplySaved(false);
                                setAdminReplyError(null);
                                setAdminReplyText(e.target.value);
                              }}
                              placeholder="Escreva a resposta ao cliente..."
                              multiline
                              minRows={3}
                              fullWidth
                              sx={{ mt: 1 }}
                            />

                            {adminReplyError && (
                              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                {adminReplyError}
                              </Typography>
                            )}
                            {adminReplySaved && (
                              <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                                Resposta enviada.
                              </Typography>
                            )}

                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setReplyingReviewId(null);
                                  setAdminReplyError(null);
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="contained"
                                disabled={isReplyingReview || adminReplyText.trim().length < 3}
                                onClick={async () => {
                                  setAdminReplySaved(false);
                                  setAdminReplyError(null);
                                  try {
                                    await replyReview({
                                      productId: product.id,
                                      reviewId: r.id,
                                      reply: adminReplyText.trim()
                                    }).unwrap();
                                    setAdminReplySaved(true);
                                    setReplyingReviewId(null);
                                  } catch (e) {
                                    setAdminReplyError(typeof e === 'string' ? e : 'Não foi possível enviar a resposta');
                                  }
                                }}
                              >
                                Enviar resposta
                              </Button>
                            </Box>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              {reviews.length > 4 && !showAllReviews && (
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={() => setShowAllReviews(true)}>
                    Ver mais
                  </Button>
                </Box>
              )}
            </>
          )}

          {user && (
            <Box sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Deixar avaliação
              </Typography>

              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating
                  value={reviewRating}
                  onChange={(_, value) => {
                    setReviewSaved(false);
                    setReviewError(null);
                    setReviewRating(value);
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {reviewRating ? `${reviewRating}/5` : ''}
                </Typography>
              </Box>

              <TextField
                value={reviewComment}
                onChange={(e) => {
                  setReviewSaved(false);
                  setReviewError(null);
                  setReviewComment(e.target.value);
                }}
                placeholder="Escreva o seu comentário..."
                multiline
                minRows={3}
                fullWidth
                sx={{ mt: 1 }}
              />

              {reviewError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {reviewError}
                </Typography>
              )}
              {reviewSaved && (
                <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                  Avaliação enviada com sucesso.
                </Typography>
              )}

              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  disabled={isSubmittingReview || !reviewRating || reviewComment.trim().length < 3}
                  onClick={async () => {
                    setReviewSaved(false);
                    setReviewError(null);
                    try {
                      await createReview({
                        productId: product.id,
                        rating: reviewRating ?? 5,
                        comment: reviewComment
                      }).unwrap();
                      setReviewComment('');
                      setReviewSaved(true);
                    } catch (e) {
                      setReviewError(typeof e === 'string' ? e : 'Não foi possível enviar a avaliação');
                    }
                  }}
                >
                  Enviar avaliação
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Grid2>

        <Grid2 size={12}>
          <Box sx={{ mt: 2 }}>
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
                {visibleSimilar.map((p, idx) => {
                  const hasDiscount = !!p.discountPercentage && p.discountPercentage > 0;
                  const finalPrice = computeFinalPrice(p.price, p.discountPercentage, p.promotionalPrice);

                  return (
                    <Box
                      key={`${p.id}-${idx}`}
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
        </Grid2>
    </Grid2>
  )
}
