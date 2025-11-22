import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';

export default function HomePage() {
  return (
    <Box maxWidth='xl' mx='auto' px={4} position='relative'>
      <Box
        position='relative'
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          minHeight: { xs: '60vh', md: '72vh' },
          backgroundImage: `url('/images/hero1.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* dark overlay */}
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)' }} />

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'white',
            textAlign: 'center',
            px: { xs: 3, md: 6 },
            py: { xs: 6, md: 0 }
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: '700',
              fontSize: { xs: '2rem', md: '3.5rem' },
              lineHeight: 1.05,
              letterSpacing: '-0.02em'
            }}
          >
            Welcome to Restore
          </Typography>

          <Typography sx={{ mt: 2, maxWidth: 900, color: 'rgba(255,255,255,0.9)' }}>
            Discover curated products, fast shipping and friendly returns — everything you need to
            shop confidently and find what you love.
          </Typography>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/catalog"
              sx={{
                backgroundImage: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)',
                color: 'white',
                fontWeight: 700,
                px: 5,
                py: 1.5,
                borderRadius: 3
              }}
            >
              Go to shop
            </Button>

            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/catalog"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.25)',
                px: 4,
                py: 1.5,
                borderRadius: 3
              }}
            >
              Explore Collections
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Features row */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
          <LocalShippingIcon color='primary' />
          <Typography variant='body2'>Free shipping over $50</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
          <LockIcon color='primary' />
          <Typography variant='body2'>Secure payments</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
          <ReplayIcon color='primary' />
          <Typography variant='body2'>30-day returns</Typography>
        </Box>
      </Box>
    </Box>
  )
}