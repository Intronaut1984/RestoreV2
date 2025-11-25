import { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button } from '@mui/material';
import { useForgotPasswordMutation } from './accountApi';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      setSubmitted(true);
      toast.success('Se existir uma conta com esse email, enviámos um link para reset.');
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
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography>Se existir uma conta com esse email, enviámos um link para reset. Verifique a sua caixa de entrada.</Typography>
          </Box>
        )}

      </Box>
    </Container>
  )
}
