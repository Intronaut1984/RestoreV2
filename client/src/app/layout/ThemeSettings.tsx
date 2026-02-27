import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box, FormControl, InputLabel, Select, MenuItem, Typography, Tabs, Tab } from '@mui/material';
import { Build, LocalShipping } from '@mui/icons-material';
import { useUserInfoQuery } from '../../features/account/accountApi';
import { useGetUiSettingsQuery, useUpdateUiSettingsMutation } from '../../features/admin/uiSettingsApi';
import AdminPromo from '../../features/admin/AdminPromo';
import AdminLogo from '../../features/admin/AdminLogo';

function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function ThemeSettings({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const [tab, setTab] = useState(0);

  const { data: user } = useUserInfoQuery();
  const isAdmin = (user?.roles ?? []).includes('Admin');

  const { data: uiSettings } = useGetUiSettingsQuery(undefined, { skip: !isAdmin });
  const [updateUiSettings, { isLoading: savingUiSettings }] = useUpdateUiSettingsMutation();

  const primaryColorLight = uiSettings?.primaryColorLight || '#1565c0';
  const secondaryColorLight = uiSettings?.secondaryColorLight || '#ffb300';
  const primaryColorDark = uiSettings?.primaryColorDark || '#90caf9';
  const secondaryColorDark = uiSettings?.secondaryColorDark || '#ffcc80';

  const currentIconColor = uiSettings?.buttonIconColor ?? 'primary';
  const currentBadgeLight = uiSettings?.notificationsBadgeColorLight ?? 'warning';
  const currentBadgeDark = uiSettings?.notificationsBadgeColorDark ?? 'secondary';

  const save = async (patch: Partial<typeof uiSettings>) => {
    await updateUiSettings({
      primaryColorLight,
      secondaryColorLight,
      primaryColorDark,
      secondaryColorDark,
      buttonIconColor: currentIconColor,
      notificationsBadgeColorLight: currentBadgeLight,
      notificationsBadgeColorDark: currentBadgeDark,
      ...(patch as object)
    } as any).unwrap();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Configurações</DialogTitle>
      <DialogContent>
        {!isAdmin ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Apenas administradores podem alterar as configurações do site.
            </Typography>
          </Box>
        ) : (
          <>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '1rem' },
                '& .MuiTab-root.Mui-selected': { fontWeight: 900 }
              }}
            >
              <Tab label="Tema" />
              <Tab label="Promo Bar" />
              <Tab label="Logo" />
            </Tabs>

            <TabPanel value={tab} index={0}>
              <Stack spacing={2} sx={{ pb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  Admin
                </Typography>

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>Light mode</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={primaryColorLight}
                        onChange={async (e) => save({ primaryColorLight: e.target.value })}
                        aria-label="Primary light"
                        disabled={savingUiSettings}
                        style={{ width: 36, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <Typography sx={{ fontWeight: 800 }}>Primária</Typography>
                      <Typography variant="body2" color="text.secondary">{primaryColorLight}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={secondaryColorLight}
                        onChange={async (e) => save({ secondaryColorLight: e.target.value })}
                        aria-label="Secondary light"
                        disabled={savingUiSettings}
                        style={{ width: 36, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <Typography sx={{ fontWeight: 800 }}>Secundária</Typography>
                      <Typography variant="body2" color="text.secondary">{secondaryColorLight}</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>Dark mode</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={primaryColorDark}
                        onChange={async (e) => save({ primaryColorDark: e.target.value })}
                        aria-label="Primary dark"
                        disabled={savingUiSettings}
                        style={{ width: 36, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <Typography sx={{ fontWeight: 800 }}>Primária</Typography>
                      <Typography variant="body2" color="text.secondary">{primaryColorDark}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={secondaryColorDark}
                        onChange={async (e) => save({ secondaryColorDark: e.target.value })}
                        aria-label="Secondary dark"
                        disabled={savingUiSettings}
                        style={{ width: 36, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <Typography sx={{ fontWeight: 800 }}>Secundária</Typography>
                      <Typography variant="body2" color="text.secondary">{secondaryColorDark}</Typography>
                    </Box>
                  </Stack>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel id="button-icon-color-label">Cor dos ícones dos botões</InputLabel>
                  <Select
                    labelId="button-icon-color-label"
                    label="Cor dos ícones dos botões"
                    value={currentIconColor}
                    onChange={async (e) => {
                      const buttonIconColor = e.target.value as 'primary' | 'secondary' | 'inherit' | 'text';
                      await save({ buttonIconColor });
                    }}
                    disabled={savingUiSettings}
                  >
                    <MenuItem value="primary">Primária</MenuItem>
                    <MenuItem value="secondary">Secundária</MenuItem>
                    <MenuItem value="text">Texto</MenuItem>
                    <MenuItem value="inherit">Herdar do botão</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="notif-badge-light-label">Notificações (Light)</InputLabel>
                  <Select
                    labelId="notif-badge-light-label"
                    label="Notificações (Light)"
                    value={currentBadgeLight}
                    onChange={async (e) => {
                      const notificationsBadgeColorLight = e.target.value as typeof currentBadgeLight;
                      await save({ notificationsBadgeColorLight });
                    }}
                    disabled={savingUiSettings}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="notif-badge-dark-label">Notificações (Dark)</InputLabel>
                  <Select
                    labelId="notif-badge-dark-label"
                    label="Notificações (Dark)"
                    value={currentBadgeDark}
                    onChange={async (e) => {
                      const notificationsBadgeColorDark = e.target.value as typeof currentBadgeDark;
                      await save({ notificationsBadgeColorDark });
                    }}
                    disabled={savingUiSettings}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pré-visualização (a cor só afeta ícones em botões com startIcon/endIcon; em botões "contained" os ícones herdam para manter contraste).
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<Build />}>Outlined</Button>
                    <Button variant="text" startIcon={<LocalShipping />}>Text</Button>
                    <Button variant="contained" startIcon={<Build />}>Contained</Button>
                  </Stack>
                </Box>
              </Stack>
            </TabPanel>

            <TabPanel value={tab} index={1}>
              <AdminPromo />
            </TabPanel>

            <TabPanel value={tab} index={2}>
              <AdminLogo />
            </TabPanel>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
