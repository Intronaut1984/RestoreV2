import { Box, Divider, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { TypographyProps } from '@mui/material/Typography';
import type { ReactNode } from 'react';

type Props = {
  title: ReactNode;
  variant?: TypographyProps['variant'];
  sx?: SxProps<Theme>;
  actions?: ReactNode;
};

export default function PageTitle({ title, variant = 'h4', sx, actions }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
        <Typography
          variant={variant}
          component="h1"
          sx={{ fontWeight: 900, ...sx }}
        >
          {title}
        </Typography>
        {actions ? <Box sx={{ flex: '0 0 auto' }}>{actions}</Box> : null}
      </Box>
      <Divider />
    </Box>
  );
}
