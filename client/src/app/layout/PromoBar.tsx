import { useEffect, useState, useRef } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

export default function PromoBar() {
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
      // Sum heights of fixed-position elements at the top of the page (exclude the promo itself)
      let totalFixedTop = 0;

      // Iterate reasonable set of elements to detect fixed top bars. We include all body children
      const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
      for (const el of all) {
        if (!el.getBoundingClientRect) continue;
        if (el === rootRef.current) continue; // don't include the promo itself

        const style = window.getComputedStyle(el);
        if (style.position !== 'fixed') continue;
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const rect = el.getBoundingClientRect();
        // consider elements that are pinned to the top (top ~= 0)
        if (Math.abs(rect.top) <= 2 && rect.height > 0) {
          totalFixedTop += Math.ceil(rect.height);
        }
      }

      // If we found no fixed elements, fallback to theme toolbar height
      const finalTop = totalFixedTop > 0 ? totalFixedTop : toolbarHeight;
      setTopOffset(`${finalTop + extraGap}px`);
    }

    // measure once and also on resize
    measure();
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(showTimer);
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
      } catch (e) {
        // ignore network errors
      }
    }

    fetchPromo();

    function onPromoUpdated(e: any) {
      if (e?.detail) {
        if (e.detail.message) setMessage(e.detail.message);
        if (e.detail.color) setColor(e.detail.color);
      } else {
        // fallback: refetch
        fetchPromo();
      }
    }

    window.addEventListener('promoUpdated', onPromoUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('promoUpdated', onPromoUpdated as EventListener);
    }
  }, []);

  return (
    <Box
      component="section"
      ref={rootRef}
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
        transition: 'opacity 500ms ease, transform 500ms ease, top 200ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-6px)',
        boxShadow: 1,
        zIndex: theme.zIndex.appBar - 1
      }}
    >
      <Typography variant={isSm ? 'body2' : 'body1'} sx={{ fontWeight: 600, lineHeight: 1 }}>
        {message}
      </Typography>
    </Box>
  );
}
