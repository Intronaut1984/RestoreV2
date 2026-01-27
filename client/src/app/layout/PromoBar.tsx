import { useEffect, useState, useRef } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PromoBar() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [topOffset, setTopOffset] = useState<number | string>(0);
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const rootRef = useRef<HTMLElement | null>(null);
  const previousBodyPaddingRef = useRef<string | null>(null);
  const [message, setMessage] = useState('Promoção: Entrega grátis em compras acima de €50 — Aproveite!');
  const [color, setColor] = useState('#050505');

  // Fallback toolbar height from theme (used only if DOM measure fails)
  const toolbarHeight = ((theme.mixins as unknown) as { toolbar?: { minHeight?: number } })?.toolbar?.minHeight ?? 64;
  const extraGap = 0; // keep it tightly attached; adjust if you still want a small gap

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 260);

    // measure the AppBar (if present) to position PromoBar directly below it
    function measure() {
      // Only measure the main AppBar. Scanning all fixed elements can accidentally
      // include overlays/backdrops and push the page content far below the fold.
      const appBar = document.querySelector<HTMLElement>('.MuiAppBar-root');
      const appBarHeight = appBar ? Math.ceil(appBar.getBoundingClientRect().height) : toolbarHeight;
      setTopOffset(`${appBarHeight + extraGap}px`);
    }

    // measure once and also on resize
    measure();
    // Run a second measure after fonts/layout settle (production can shift sizes slightly)
    const settleTimer = window.setTimeout(measure, 500);
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(showTimer);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', measure);
    };
  }, [theme, toolbarHeight, extraGap, isSm]);

  // when the promo becomes visible, ensure page content is pushed down
  useEffect(() => {
    function applyBodyPadding() {
      const rootEl = rootRef.current;
      if (!rootEl) return;

      // save previous inline paddingTop so we can restore it later
      if (previousBodyPaddingRef.current === null) {
        previousBodyPaddingRef.current = document.body.style.paddingTop || '';
      }

      const promoHeight = Math.ceil(rootEl.getBoundingClientRect().height || 0);
      // topOffset is like '64px' or number; try to parse a number
      const parsedTop = typeof topOffset === 'string' ? parseInt(topOffset, 10) || 0 : (topOffset as number || 0);
      const total = parsedTop + promoHeight;

      // respect existing computed paddingTop (from CSS) and only increase if our total is larger
      const computed = window.getComputedStyle(document.body).paddingTop;
      const computedVal = parseInt(computed, 10) || 0;
      if (computedVal < total) {
        document.body.style.paddingTop = `${total}px`;
      }
    }

    function resetBodyPadding() {
      if (previousBodyPaddingRef.current !== null) {
        document.body.style.paddingTop = previousBodyPaddingRef.current;
        previousBodyPaddingRef.current = null;
      }
    }

    if (visible) {
      // allow browser to compute layout first
      requestAnimationFrame(applyBodyPadding);
      window.addEventListener('resize', applyBodyPadding);
    } else {
      resetBodyPadding();
    }

    return () => {
      window.removeEventListener('resize', applyBodyPadding);
      resetBodyPadding();
    };
  }, [visible, topOffset]);

  // fetch promo from public endpoint and listen for updates
  useEffect(() => {
    let mounted = true;

    async function fetchPromo() {
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const url = `${base.replace(/\/$/, '')}/promo`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (data?.message) setMessage(data.message);
        if (data?.color) setColor(data.color);
      } catch {
        // ignore network errors
      }
    }

    fetchPromo();

    const onPromoUpdated = (_e: Event) => {
      const customEvent = _e as CustomEvent;
      if (customEvent?.detail) {
        if (customEvent.detail.message) setMessage(customEvent.detail.message);
        if (customEvent.detail.color) setColor(customEvent.detail.color);
      } else {
        // fallback: refetch
        fetchPromo();
      }
    }

    window.addEventListener('promoUpdated', onPromoUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('promoUpdated', onPromoUpdated);
    }
  }, []);

  return (
    <Box
      component="section"
      ref={rootRef}
      onClick={() => navigate('/catalog')}
      sx={{
        position: 'fixed',
        top: topOffset,
        left: 0,
        right: 0,
        width: '100%',
        bgcolor: color,
        color: '#fff',
        py: { xs: 0.75, sm: 1 },
        px: { xs: 2, sm: 3 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'opacity 500ms ease, transform 500ms ease, top 200ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-6px)',
        boxShadow: 1,
        zIndex: theme.zIndex.appBar - 1,
        '&:hover': {
          opacity: visible ? 0.9 : 0
        }
      }}
    >
      <Typography variant={isSm ? 'body2' : 'body1'} sx={{ fontWeight: 600, lineHeight: 1 }}>
        {message}
      </Typography>
    </Box>
  );
}
