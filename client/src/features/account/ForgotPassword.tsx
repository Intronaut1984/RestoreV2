import { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, InputAdornment, IconButton } from '@mui/material';
import { useForgotPasswordMutation } from './accountApi';
import { toast } from 'react-toastify';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      if (res?.resetUrl) {
        setResetUrl(res.resetUrl);
      }
      setSubmitted(true);
      toast.success('Link gerado abaixo (apenas em ambiente de desenvolvimento).');
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
            {resetUrl ? (
              <>
                <Typography>Link de reset gerado (copie e abra localmente):</Typography>
                <TextField fullWidth value={resetUrl} InputProps={{ readOnly: true, endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton onClick={() => { navigator.clipboard.writeText(resetUrl); toast.success('Link copiado'); }}>
                      <ContentCopyIcon />
                    </IconButton>
                  </InputAdornment>
                ) }} sx={{ mt: 1 }} />
                <Box display='flex' gap={1} mt={1}>
                  <Button variant='outlined' onClick={() => { window.open(resetUrl, '_blank'); }}>Abrir</Button>
                </Box>
              </>
            ) : (
              <Typography>Se existir uma conta com esse email, um link foi gerado. Verifique a sua caixa de entrada.</Typography>
            )}
          </Box>
        )}

      </Box>
    </Container>
  )
}
