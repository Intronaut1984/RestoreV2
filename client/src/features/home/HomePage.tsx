import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';

export default function HomePage() {
  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Box
        position='relative'
        sx={{
          borderRadius: 0,
          overflow: 'hidden',
          minHeight: { xs: '56vh', md: '72vh' },
          backgroundImage: `url('/images/BookStore.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100vw',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          mt: -8
        }}
      >
        {/* dark overlay */}
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)' }} />

        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            px: { xs: 3, md: 6 }
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
            My Store
          </Typography>

          <Typography sx={{ mt: 2, maxWidth: 900, color: 'rgba(255,255,255,0.9)' }}>
            A Man with Reason is the Strongest
          </Typography>

          <Box sx={{ mt: { xs: 3, md: 3 }, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/catalog"
              sx={{
                backgroundImage: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)',
                color: 'white',
                fontWeight: 700,
                px: { xs: 4, md: 5 },
                py: { xs: 1, md: 1.5 },
                borderRadius: 3
              }}
            >
              Go to shop
            </Button>

            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/login"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.25)',
                px: { xs: 3, md: 4 },
                py: { xs: 1, md: 1.5 },
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