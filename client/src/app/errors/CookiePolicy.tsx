import { Box, Button, Container, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useCookieConsent } from '../layout/cookieConsent';
import PageTitle from '../shared/components/PageTitle';

export default function CookiePolicy() {
  const { openPreferences } = useCookieConsent();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageTitle title="Política de Cookies" variant="h4" />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body1" color="text.secondary">
            Esta página explica como usamos cookies e tecnologias semelhantes (ex: armazenamento local) para garantir o funcionamento do site e, se autorizar, melhorar a experiência através de estatísticas.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>1. O que são cookies?</Typography>
          <Typography>
            Cookies são pequenos ficheiros guardados no seu dispositivo. São usados, por exemplo, para manter sessões, guardar preferências e melhorar a segurança.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>2. Que tipos de cookies usamos?</Typography>
          <Typography sx={{ mb: 1 }}>
            No nosso site, distinguimos:
          </Typography>
          <ul>
            <li>
              <strong>Necessários (sempre ativos)</strong>: essenciais para funcionalidades do site (ex: login/sessão, cesto de compras, segurança).
            </li>
            <li>
              <strong>Analytics (opcionais)</strong>: ajudam-nos a perceber o que funciona melhor (ex: cliques em produtos) para melhorar catálogo e campanhas.
            </li>
          </ul>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>3. Como gerir as suas preferências</Typography>
          <Typography sx={{ mb: 1 }}>
            Pode alterar as suas preferências a qualquer momento:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="contained" onClick={openPreferences}>
              Abrir preferências de cookies
            </Button>
            <Link component={RouterLink} to="/privacy-policy" underline="hover">
              Ver Política de Privacidade
            </Link>
          </Box>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>4. Para que mais posso usar cookies (com consentimento)?</Typography>
          <Typography>
            Para além de analytics, cookies podem ser usados para: lembrar preferências (tema/idioma), melhorar performance (cache), personalização (produtos recomendados), prevenção de fraude e segurança.
            Sempre que não forem estritamente necessários, devem ser opcionais e depender do seu consentimento.
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Última atualização: 28/01/2026
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
