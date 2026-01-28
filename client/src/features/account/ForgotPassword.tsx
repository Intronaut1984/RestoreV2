import { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button } from '@mui/material';
import { useForgotPasswordMutation } from './accountApi';
import { toast } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      setServerMessage(res?.message ?? 'Se existir uma conta com esse email, enviámos um link para repor a password.');
      setSubmitted(true);
      toast.success(res?.message ?? 'Email enviado');
    } catch (err) {
      toast.error('Problema ao solicitar reset de password');
      console.log(err);
    }
  };

  return (
    <Container component={Paper} maxWidth='sm' sx={{ borderRadius: 3 }}>
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='8' sx={{ p: 3 }}>
        <Typography variant="h5">Esqueci-me da Password</Typography>
        {!submitted ? (
          <Box component='form' onSubmit={onSubmit} width='100%' display='flex' flexDirection='column' gap={2} mt={2}>
            <TextField label='Email' fullWidth value={email} onChange={e => setEmail(e.target.value)} />
            <Button type='submit' variant='contained' disabled={isLoading}>Enviar</Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
            <Typography sx={{ textAlign: 'center', fontWeight: 700 }}>Email enviado</Typography>
            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              {serverMessage || 'Se existir uma conta com esse email, enviámos um link para repor a password. Verifique a sua caixa de entrada.'}
            </Typography>
          </Box>
        )}

      </Box>
    </Container>
  )
}
