import { Box, Typography } from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useGetHeroBlocksQuery } from '../admin/heroBlocksApi';

type HeroImage = { id: number; url: string; publicId?: string; order?: number };
type HeroBlock = { id: number; title?: string; visible: boolean; order?: number; images?: HeroImage[] };

export default function HomePage() {
  const { data: blocks } = useGetHeroBlocksQuery();
  const [pullUp, setPullUp] = useState<number>(-10);

  // each block handles its own slideshow interval via local state

  useEffect(() => {
    const measure = () => {
      const appBarEl = document.querySelector('.MuiAppBar-root') as HTMLElement | null;
      const promoEl = document.querySelector('.promo-bar') as HTMLElement | null;
      const appBarHeight = appBarEl ? appBarEl.offsetHeight : 64;
      const promoHeight = promoEl ? promoEl.offsetHeight : 0;
      setPullUp(-(appBarHeight + promoHeight));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // only show blocks that are visible and that have at least one image
  const visibleBlocks = (blocks ?? [])
    .filter((b: HeroBlock) => b.visible && ((b.images?.length ?? 0) > 0))
    .slice(0, 3);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Render up to 3 hero blocks configured in the backend. If none exist, show nothing. */}
      {visibleBlocks.map((b: HeroBlock) => (
        <HeroBlockView key={b.id} block={b} pullUp={pullUp} />
      ))}

      {/* Features row */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
          <LocalShippingIcon color='primary' />
          <Typography variant='body2'>Free shipping over €50</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
          <LockIcon color='primary' />
          <Typography variant='body2'>Secure payments</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
          <ReplayIcon color='primary' />
          <Typography variant='body2'>30-day returns</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function HeroBlockView({ block, pullUp }: { block: HeroBlock, pullUp: number }) {
  const images: string[] = (block.images ?? []).map((i: HeroImage) => i.url);
  const [index, setIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => setIndex(i => (i + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images]);

  return (
    <Box
      ref={heroRef}
      sx={{ position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', minHeight: { xs: '40vh', md: '60vh' }, overflow: 'hidden', mt: 2, cursor: 'pointer' }}
      style={{ marginTop: `${pullUp}px` }}
      onClick={() => navigate('/catalog')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/catalog'); }}
    >
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${images[index] ?? ''})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 500ms ease-in-out' }} />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <Button variant="contained" color="primary" onClick={(e) => { e.stopPropagation(); navigate('/catalog'); }}>Ver Produtos</Button>
      </Box>
    </Box>
  )
}

// no default hero view: when there are no blocks we show no hero images