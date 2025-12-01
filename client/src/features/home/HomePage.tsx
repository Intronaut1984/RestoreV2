import { Box, Typography } from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';
import StorefrontIcon from '@mui/icons-material/Storefront';
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

      {/* static features row removed — slides are shown per-hero block */}
    </Box>
  );
}

function HeroBlockView({ block, pullUp }: { block: HeroBlock, pullUp: number }) {
  const images: string[] = (block.images ?? []).map((i: HeroImage) => i.url);
  const [index, setIndex] = useState(0);
  const [featIndex, setFeatIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // image slideshow for this hero block
  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => setIndex(i => (i + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images]);

  // features to show in bottom sliding bar
  const features = [
    { id: 'shipping', icon: <LocalShippingIcon color="primary" />, text: 'Free shipping over €50' },
    { id: 'secure', icon: <LockIcon color="primary" />, text: 'Secure payments' },
    { id: 'returns', icon: <ReplayIcon color="primary" />, text: '30-day returns' },
  ];

  useEffect(() => {
    const id = setInterval(() => setFeatIndex(i => (i + 1) % features.length), 3500);
    return () => clearInterval(id);
  }, [features.length]);

  return (
    <Box sx={{ width: '100%', p: 0, m: 0 }}>
      {/* hero image area (fixed px height for predictability) */}
      <Box
        ref={heroRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 240, md: 400 },
          overflow: 'hidden',
          mt: 0,
          cursor: 'pointer',
        }}
        style={{ marginTop: `${pullUp}px` }}
        onClick={() => navigate('/catalog')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/catalog'); }}
      >
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${images[index] ?? ''})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 500ms ease-in-out' }} />

        {/* Bottom-aligned CTA inside hero */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: { xs: 12, md: 24 }, display: 'flex', justifyContent: 'center', zIndex: 4, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <Button
            aria-label="Ver Produtos"
            variant="contained"
            onClick={() => navigate('/catalog')}
            sx={{
              bgcolor: 'white',
              color: 'common.black',
              px: { xs: 16, md: 24 },
              py: { xs: 0.75, md: 1 },
              borderRadius: 6,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: { xs: '0.9rem', md: '1rem' },
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backdropFilter: 'blur(6px)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 14px 40px rgba(0, 0, 0, 0.32)',
                bgcolor: 'primary.dark',
              },
              transition: 'all 180ms ease',
            }}
          >
            <StorefrontIcon fontSize="small" />
            Ver Produtos
          </Button>
        </Box>
      </Box>

      {/* Thin full-bleed sliding features bar immediately after the hero image */}
      <Box sx={{ width: '100%', height: { xs: 56, md: 80 }, overflow: 'hidden', mt: 0 }} onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', width: `${features.length * 100}%`, height: '100%', transform: `translateX(-${featIndex * (100 / features.length)}%)`, transition: 'transform 450ms cubic-bezier(.22,.9,.32,1)' }}>
          {features.map(f => (
            <Box key={f.id} sx={{ flex: `0 0 ${100 / features.length}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 2, height: '100%' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                {f.icon}
              </Box>
              <Typography variant='body1' sx={{ fontWeight: 600 }}>{f.text}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// no default hero view: when there are no blocks we show no hero images