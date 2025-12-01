import { Box, Typography } from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';
import { useEffect, useState, useRef } from 'react';
import { useGetHeroBlocksQuery } from '../admin/heroBlocksApi';

type HeroImage = { id: number; url: string; publicId?: string; order?: number };
type HeroBlock = { id: number; title?: string; visible: boolean; order?: number; images?: HeroImage[] };

export default function HomePage() {
  const { data: blocks } = useGetHeroBlocksQuery();
  const defaultSlides = ['/images/Slide1.jpg', '/images/Slide2.jpg', '/images/Slide3.jpg'];
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

  const visibleBlocks = (blocks ?? []).filter((b: HeroBlock) => b.visible).slice(0, 3);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Render up to 3 hero blocks configured in the backend. If none exist, show default slideshow. */}
      {visibleBlocks.length === 0 ? (
        <DefaultHeroView slides={defaultSlides} pullUp={pullUp} />
      ) : (
        visibleBlocks.map((b: HeroBlock) => (
          <HeroBlockView key={b.id} block={b} pullUp={pullUp} defaultSlides={defaultSlides} />
        ))
      )}

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

function HeroBlockView({ block, pullUp, defaultSlides }: { block: HeroBlock, pullUp: number, defaultSlides?: string[] }) {
  const images: string[] = (block.images ?? []).map((i: HeroImage) => i.url);
  const [index, setIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const source = images.length ? images : (defaultSlides ?? []);
    if (!source.length) return;
    const id = setInterval(() => setIndex(i => (i + 1) % source.length), 3000);
    return () => clearInterval(id);
  }, [images, defaultSlides]);

  return (
    <Box
      ref={heroRef}
      sx={{ position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', minHeight: { xs: '40vh', md: '60vh' }, overflow: 'hidden', mt: 2 }}
      style={{ marginTop: `${pullUp}px` }}
    >
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${(images.length ? images : (defaultSlides ?? []))[index] ?? ''})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 500ms ease-in-out' }} />
    </Box>
  )
}

function DefaultHeroView({ slides, pullUp }: { slides: string[]; pullUp: number }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!slides.length) return;
    const id = setInterval(() => setIndex(i => (i + 1) % slides.length), 3000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <Box
      sx={{ position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', minHeight: { xs: '40vh', md: '60vh' }, overflow: 'hidden', mt: 2 }}
      style={{ marginTop: `${pullUp}px` }}
    >
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${slides[index] ?? ''})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 500ms ease-in-out' }} />
    </Box>
  )
}