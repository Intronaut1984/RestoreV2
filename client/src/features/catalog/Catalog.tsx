import { Grid, Typography, Box, CircularProgress, Skeleton } from "@mui/material";
import ProductList from "./ProductList";
import { useFetchFiltersQuery, useFetchProductsQuery } from "./catalogApi";
import Filters from "./Filters";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import AppPagination from "../../app/shared/components/AppPagination";
import { setPageNumber } from "./catalogSlice";
import { useLocation } from 'react-router-dom';
import { setHasDiscount, setCampaigns, setCategories } from './catalogSlice';
import { useEffect } from 'react';

export default function Catalog() {
  const productParams = useAppSelector(state => state.catalog);
  const {data, isLoading} = useFetchProductsQuery(productParams);
  const {data: filtersData, isLoading: filtersLoading} = useFetchFiltersQuery();
  const dispatch = useAppDispatch();
  const location = useLocation();

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
          <Typography variant="h5">There are no results for this filter</Typography>
        )}
      </Grid>
    </Grid>
  )
}