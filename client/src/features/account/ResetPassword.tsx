import { useState, useEffect } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, InputAdornment, IconButton } from '@mui/material';
import { useResetPasswordMutation } from './accountApi';
import { toast } from 'react-toastify';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get('email') ?? '';
  const tokenParam = searchParams.get('token') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    setEmail(emailParam);
    setToken(tokenParam);
  }, [emailParam, tokenParam]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirm) {
      toast.error('Preencha a nova password e confirmação');
      return;
    }
    if (newPassword !== confirm) {
      toast.error('A nova password e a confirmação não coincidem');
      return;
    }
    try {
      // send the token URL-encoded so backend UrlDecode(...) restores original token
      const encodedToken = encodeURIComponent(token);
      await resetPassword({ email, token: encodedToken, newPassword }).unwrap();
      toast.success('Password reposta com sucesso');
      navigate('/login');
    } catch (err) {
      toast.error('Problema a repor a password');
      console.log(err);
    }
  };

  return (
    <Container component={Paper} maxWidth='sm' sx={{ borderRadius: 3 }}>
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='8' sx={{ p: 3 }}>
        <Typography variant="h5">Repor Password</Typography>
        <Box component='form' onSubmit={onSubmit} width='100%' display='flex' flexDirection='column' gap={2} mt={2}>
          <TextField label='Email' fullWidth value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label='Token' fullWidth value={token} onChange={e => setToken(e.target.value)} />
          <TextField
            label='New password'
            fullWidth
            type={show ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton edge='end' onClick={() => setShow(s => !s)}>
                    {show ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField label='Confirm new password' fullWidth type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} />
          <Button type='submit' variant='contained' disabled={isLoading}>Reset</Button>
        </Box>
      </Box>
    </Container>
  )
}
