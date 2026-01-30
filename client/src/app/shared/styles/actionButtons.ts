import type { SxProps, Theme } from '@mui/material/styles';

const base: SxProps<Theme> = {
  borderRadius: 999,
  fontWeight: 800,
  textTransform: 'none',
};

export const primaryActionSx = (theme: Theme): SxProps<Theme> => {
  const isLight = theme.palette.mode === 'light';
  const secondaryDark = theme.palette.secondary.dark || theme.palette.secondary.main;

  return {
    ...base,
    boxShadow: 'none',
    ...(isLight
      ? {
          bgcolor: `${theme.palette.grey[900]} !important`,
          color: `${theme.palette.common.white} !important`,
          '&:hover': { bgcolor: `${theme.palette.grey[800]} !important` },
        }
      : {
          bgcolor: `${theme.palette.secondary.main} !important`,
          color: `${theme.palette.common.black} !important`,
          '&:hover': { bgcolor: `${secondaryDark} !important` },
        }),
  };
};

export const secondaryActionSx = (theme: Theme): SxProps<Theme> => {
  const isLight = theme.palette.mode === 'light';

  return {
    ...base,
    ...(isLight
      ? {
          borderColor: `${theme.palette.grey[900]} !important`,
          color: `${theme.palette.grey[900]} !important`,
          '&:hover': { borderColor: `${theme.palette.grey[800]} !important` },
        }
      : {
          borderColor: `${theme.palette.secondary.main} !important`,
          color: `${theme.palette.secondary.main} !important`,
          '&:hover': { borderColor: `${theme.palette.secondary.main} !important` },
        }),
  };
};
