import { useEffect, useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

export default function PromoBar() {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const toolbarHeight = ((theme.mixins as unknown) as { toolbar?: { minHeight?: number } })?.toolbar?.minHeight ?? 64;
  // extra offset on small screens to account for the toolbar + mobile mid-links row
  const mobileExtra = isSm ? 72 : 0;
  const extraGap = 8; // small gap between AppBar and PromoBar to avoid being too close

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 260);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      component="section"
      sx={{
        position: 'fixed',
        top: `${toolbarHeight + mobileExtra + extraGap}px`,
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
        transition: 'opacity 500ms ease, transform 500ms ease',
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
