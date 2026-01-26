import { Box, Container, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import NavBar from "./NavBar";
import PromoBar from "./PromoBar";
import Footer from "./Footer";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useAppSelector } from "../store/store";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { googleClientId, hasGoogleClientId } from "../config/env";


function App() {
  const { darkMode, colors } = useAppSelector(state => state.ui);
  const palleteType = darkMode ? 'dark' : 'light';
  const modeColors = colors?.[palleteType as 'light'|'dark'] ?? { primary: '#1565c0', secondary: '#ffb300' };

  const theme = createTheme({
    palette: {
      mode: palleteType,
      primary: { main: modeColors.primary },
      secondary: { main: modeColors.secondary },
      background: {
        default: palleteType === 'light' ? '#ffffffff' : '#000000ff'
      }
    }
  });

  const appShell = (
    <ThemeProvider theme={theme}>
      <ScrollRestoration />
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <PromoBar />
        <Box
          sx={{
            flex: 1,
            background: darkMode
              ? 'radial-gradient(circle, #1d0d03ff, #111B27)'
              : 'radial-gradient(circle, #c9bfacff, #ffffffff)',
            py: 0
          }}
        >
          <Container maxWidth='xl' sx={{ mt: 0 }}>
            <Outlet />
          </Container>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );

  return hasGoogleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId!}>
      {appShell}
    </GoogleOAuthProvider>
  ) : (
    appShell
  );
}

export default App
