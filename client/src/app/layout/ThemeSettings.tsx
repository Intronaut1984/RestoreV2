import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setPaletteColor } from './uiSlice';

export default function ThemeSettings({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const dispatch = useAppDispatch();
  const { colors } = useAppSelector(state => state.ui);
  const [mode, setMode] = useState<'light'|'dark'>('light');

  const handleChange = (key: 'primary'|'secondary', value: string) => {
    dispatch(setPaletteColor({ mode, key, color: value }));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Configurações de Tema</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ py: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="theme-mode-label">Modo</InputLabel>
            <Select
              labelId="theme-mode-label"
              value={mode}
              label="Modo"
              onChange={(e) => setMode(e.target.value as 'light'|'dark')}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <label style={{ display: 'block', marginBottom: 6 }}>Primary</label>
            <input type="color" value={colors[mode].primary} onChange={e => handleChange('primary', e.target.value)} />
          </Box>

          <Box>
            <label style={{ display: 'block', marginBottom: 6 }}>Secondary</label>
            <input type="color" value={colors[mode].secondary} onChange={e => handleChange('secondary', e.target.value)} />
          </Box>

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
