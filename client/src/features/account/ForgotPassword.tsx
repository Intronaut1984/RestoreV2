import { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button } from '@mui/material';
import { useForgotPasswordMutation } from './accountApi';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [forgotPassword] = useForgotPasswordMutation();
  const [result, setResult] = useState<{ resetUrl?: string; token?: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      setResult(res);
      toast.success('If an account exists we created a reset token (dev).');
    } catch (err) {
      toast.error('Problem requesting password reset');
      console.log(err);
    }
  };

  return (
    <Container component={Paper} maxWidth='sm' sx={{ borderRadius: 3 }}>
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='8' sx={{ p: 3 }}>
        <Typography variant="h5">Esqueci-me da Password</Typography>
        <Box component='form' onSubmit={onSubmit} width='100%' display='flex' flexDirection='column' gap={2} mt={2}>
          <TextField label='Email' fullWidth value={email} onChange={e => setEmail(e.target.value)} />
          <Button type='submit' variant='contained'>Enviar</Button>
        </Box>

        {result?.resetUrl && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography variant='subtitle2'>Reset URL (dev):</Typography>
            <TextField value={result.resetUrl} fullWidth multiline />
          </Box>
        )}

      </Box>
    </Container>
  )
}
