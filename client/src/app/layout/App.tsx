import { Box, Container, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import NavBar from "./NavBar";
import PromoBar from "./PromoBar";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useAppSelector } from "../store/store";


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

  return (
    <ThemeProvider theme={theme}>
      <ScrollRestoration />
      <CssBaseline />
      <NavBar />
      <PromoBar />
      <Box
        sx={{
          minHeight: '100vh',
          background: darkMode 
            ? 'radial-gradient(circle, #9c6f0eff, #111B27)'
            : 'radial-gradient(circle, #c9bfacff, #ffffffff)',
          py: 0
        }}
      >
        <Container maxWidth='xl' sx={{ mt: 0 }}>
          <Outlet />
        </Container>
      </Box>

    </ThemeProvider>

  )
}

export default App
