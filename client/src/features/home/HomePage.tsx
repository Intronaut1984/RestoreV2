import { Box, Typography } from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';
import { useEffect, useState, useRef } from 'react';

export default function HomePage() {
  const slides = ['/images/Slide1.jpg', '/images/Slide2.jpg', '/images/Slide3.jpg'];
  const [index, setIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [pullUp, setPullUp] = useState<number>(-10);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(id);
  }, [slides.length]);

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

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        ref={heroRef}
        sx={{ position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', minHeight: { xs: '40vh', md: '60vh' }, overflow: 'hidden' }}
        style={{ marginTop: `${pullUp}px` }}
      >
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${slides[index]})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 500ms ease-in-out' }} />
      </Box>

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