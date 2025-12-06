import { Grid, Typography, Box, CircularProgress, Skeleton, Button } from "@mui/material";
import { Link } from 'react-router-dom';
import ProductList from "./ProductList";
import { useFetchFiltersQuery, useFetchProductsQuery } from "./catalogApi";
import Filters from "./Filters";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import AppPagination from "../../app/shared/components/AppPagination";
import { setPageNumber } from "./catalogSlice";
import { useLocation } from 'react-router-dom';
import { setHasDiscount, setCampaigns, setCategories, resetParams } from './catalogSlice';
import { useEffect } from 'react';

export default function Catalog() {
  const productParams = useAppSelector(state => state.catalog);
  const {data, isLoading} = useFetchProductsQuery(productParams);
  const {data: filtersData, isLoading: filtersLoading} = useFetchFiltersQuery();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const handleResetFilters = () => {
    dispatch(resetParams());
    dispatch(setPageNumber(1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Read query params on mount so links like /catalog?hasDiscount=true work
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    if (qs.has('hasDiscount')) {
      dispatch(setHasDiscount(qs.get('hasDiscount') === 'true'));
    } else {
      // No explicit hasDiscount param -> clear any previously-applied discount filter
      dispatch(setHasDiscount(undefined));
    }
    if (qs.has('campaignIds')) {
      const ids = qs.get('campaignIds')?.split(',').map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n)) ?? [];
      dispatch(setCampaigns(ids));
    }
    else {
      // clear campaign filter when not present in querystring
      dispatch(setCampaigns([]));
    }
    if (qs.has('categoryIds')) {
      const ids = qs.get('categoryIds')?.split(',').map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n)) ?? [];
      dispatch(setCategories(ids));
    }
    else {
      // clear category filter when not present in querystring
      dispatch(setCategories([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  if (isLoading || !data || filtersLoading || !filtersData) return (
    <Box sx={{ width: '100%', py: { xs: 6, md: 8 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <CircularProgress size={48} />
      </Box>

      <Grid container spacing={3} sx={{ px: { xs: 2, md: 0 } }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={6} sm={6} md={3} display='flex' justifyContent='center' key={`skeleton-${i}`}>
            <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 260 } }}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
              <Skeleton width="60%" height={24} sx={{ mt: 1 }} />
              <Skeleton width="40%" height={28} sx={{ mt: 0.5 }} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rectangular" width="60%" height={36} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width="35%" height={36} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  return (
    <Grid container spacing={4} sx={{ pt: { xs: 8, md: 10 } }}>
      <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Filters filtersData={filtersData} />
      </Grid>
      <Grid item xs={12} md={9}>
        {data.items && data.items.length > 0 ? (
          <>
            <ProductList products={data.items} />
            <AppPagination
              metadata={data.pagination}
              onPageChange={(page: number) => {
                dispatch(setPageNumber(page));
                window.scrollTo({top: 0, behavior: 'smooth'})
              }}
            />
          </>
        ) : (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: { xs: 6, md: 8 } }}>
            <Box sx={{ textAlign: 'center', maxWidth: 640, px: 2 }}>
              <Box sx={{ width: 140, height: 140, mx: 'auto', mb: 2 }}>
                <Box sx={{ width: '100%', height: '100%', borderRadius: 2, border: '2px dashed', borderColor: 'grey.400', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M55.146 51.887L41.588 38.329a16 16 0 10-3.259 3.259l13.558 13.558a2.3 2.3 0 003.259-3.259zM14 26a12 12 0 1124 0 12 12 0 01-24 0z"/>
                  </svg>
                </Box>
              </Box>

              <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>
                Nenhum produto encontrado
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Ajuste ou limpe os filtros para ver mais produtos. Experimente repor os filtros ou navegar pela loja.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button onClick={handleResetFilters} variant="outlined">Repor filtros</Button>
                <Button component={Link} to="/catalog" onClick={handleResetFilters} variant="contained">Ver todos os produtos</Button>
              </Box>
            </Box>
          </Box>
        )}
      </Grid>
    </Grid>
  )
}