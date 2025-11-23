import { useEffect, useState, useRef } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

export default function PromoBar() {
  const [visible, setVisible] = useState(false);
  const [topOffset, setTopOffset] = useState<number | string>(0);
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const rootRef = useRef<HTMLElement | null>(null);

  // Fallback toolbar height from theme (used only if DOM measure fails)
  const toolbarHeight = ((theme.mixins as unknown) as { toolbar?: { minHeight?: number } })?.toolbar?.minHeight ?? 64;
  const extraGap = 0; // keep it tightly attached; adjust if you still want a small gap

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 260);

    // measure the AppBar (if present) to position PromoBar directly below it
    function measure() {
      // Try common selectors used by MUI AppBar/NavBar
      const selectors = [
        '.MuiAppBar-root',
        'header[role="banner"]',
        '#app-navbar',
        '.navbar',
      ];

      let foundHeight: number | null = null;
      for (const sel of selectors) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el && el.getBoundingClientRect) {
          const h = Math.ceil(el.getBoundingClientRect().height);
          if (h > 0) {
            foundHeight = h;
            break;
          }
        }
      }

      // If no AppBar found, fallback to theme toolbar height
      const finalTop = foundHeight ?? toolbarHeight;
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
        bgcolor: '#1e3aBa',
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
        Promoção: Entrega grátis em compras acima de €50 — Aproveite!
      </Typography>
    </Box>
  );
}
