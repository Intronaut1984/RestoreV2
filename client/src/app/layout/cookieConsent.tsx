import Cookies from 'js-cookie';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  Paper,
  Switch,
  Typography,
} from '@mui/material';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export type CookieConsent = {
  version: 1;
  necessary: true;
  analytics: boolean;
  updatedAt: string; // ISO
};

const CONSENT_COOKIE = 'restore_cookie_consent';
const CONSENT_STORAGE_KEY = 'restore_cookie_consent';
const CONSENT_DAYS = 180;

function safeParseConsent(raw: string | undefined): CookieConsent | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Partial<CookieConsent>;
    if (obj.version !== 1) return null;
    if (obj.necessary !== true) return null;
    if (typeof obj.analytics !== 'boolean') return null;
    if (typeof obj.updatedAt !== 'string') return null;
    return obj as CookieConsent;
  } catch {
    return null;
  }
}

export function getCookieConsent(): CookieConsent | null {
  const fromCookie = safeParseConsent(Cookies.get(CONSENT_COOKIE));
  if (fromCookie) return fromCookie;

  try {
    return safeParseConsent(localStorage.getItem(CONSENT_STORAGE_KEY) ?? undefined);
  } catch {
    return null;
  }
}

function persistCookieConsent(consent: CookieConsent) {
  const value = JSON.stringify(consent);

  Cookies.set(CONSENT_COOKIE, value, {
    expires: CONSENT_DAYS,
    sameSite: 'lax',
    secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : true,
  });

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  analyticsAllowed: boolean;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
  savePreferences: (opts: { analytics: boolean }) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefsAnalytics, setPrefsAnalytics] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    setConsent(existing);
    setPrefsAnalytics(existing?.analytics ?? false);
  }, []);

  const analyticsAllowed = !!consent?.analytics;

  const applyConsent = useCallback((next: CookieConsent) => {
    setConsent(next);
    setPrefsAnalytics(next.analytics);
    persistCookieConsent(next);
  }, []);

  const acceptAll = useCallback(() => {
    applyConsent({ version: 1, necessary: true, analytics: true, updatedAt: new Date().toISOString() });
  }, [applyConsent]);

  const acceptNecessaryOnly = useCallback(() => {
    applyConsent({ version: 1, necessary: true, analytics: false, updatedAt: new Date().toISOString() });
  }, [applyConsent]);

  const openPreferences = useCallback(() => {
    const existing = getCookieConsent();
    setPrefsAnalytics(existing?.analytics ?? consent?.analytics ?? false);
    setPrefsOpen(true);
  }, [consent?.analytics]);

  const closePreferences = useCallback(() => setPrefsOpen(false), []);

  const savePreferences = useCallback((opts: { analytics: boolean }) => {
    applyConsent({ version: 1, necessary: true, analytics: opts.analytics, updatedAt: new Date().toISOString() });
    setPrefsOpen(false);
  }, [applyConsent]);

  const value = useMemo<CookieConsentContextValue>(() => ({
    consent,
    analyticsAllowed,
    acceptAll,
    acceptNecessaryOnly,
    openPreferences,
    closePreferences,
    savePreferences,
  }), [consent, analyticsAllowed, acceptAll, acceptNecessaryOnly, openPreferences, closePreferences, savePreferences]);

  const showBanner = consent === null;

  return (
    <CookieConsentContext.Provider value={value}>
      {children}

      {showBanner && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: (t) => t.zIndex.modal + 1,
            p: { xs: 2, md: 2.5 },
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Este site usa cookies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usamos cookies necessários para funcionalidades como sessão e cesto de compras. Com a sua autorização, usamos também cookies/armazenamento para analytics (ex: contabilizar cliques em produtos) para melhorar a loja.
                {' '}
                <Link component={RouterLink} to="/cookie-policy" underline="hover">
                  Política de Cookies
                </Link>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-end', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <Button variant="outlined" color="inherit" onClick={openPreferences}>
                Preferências
              </Button>
              <Button variant="outlined" color="inherit" onClick={acceptNecessaryOnly}>
                Só necessários
              </Button>
              <Button variant="contained" onClick={acceptAll}>
                Aceitar tudo
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <Dialog open={prefsOpen} onClose={closePreferences} maxWidth="sm" fullWidth>
        <DialogTitle>Preferências de cookies</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Cookies necessários</Typography>
              <Typography variant="body2" color="text.secondary">
                Sempre ativos. Incluem cookies essenciais para login/sessão, segurança e cesto de compras.
              </Typography>
            </Box>

            <Box>
              <FormControlLabel
                control={<Switch checked={prefsAnalytics} onChange={(e) => setPrefsAnalytics(e.target.checked)} />}
                label="Analytics (cliques, estatísticas)"
              />
              <Typography variant="body2" color="text.secondary">
                Ajuda-nos a perceber o que funciona melhor (ex: produtos mais vistos/clicados), para melhorar catálogo e campanhas.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreferences} color="inherit">Cancelar</Button>
          <Button onClick={() => savePreferences({ analytics: prefsAnalytics })} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </CookieConsentContext.Provider>
  );
}
