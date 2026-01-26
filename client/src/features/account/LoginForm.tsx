import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Container, Paper, TextField, Typography, IconButton, InputAdornment, useTheme, Alert, Divider } from "@mui/material";
import { LoadingButton } from '@mui/lab';
import { useForm } from "react-hook-form";
import { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginSchema, LoginSchema } from "../../lib/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLazyUserInfoQuery, useLoginMutation } from "./accountApi";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginForm() {
    const [login, {isLoading}] = useLoginMutation();
    const [fetchUserInfo] = useLazyUserInfoQuery();
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    const location = useLocation();
    const {register, handleSubmit, formState: {errors}} = useForm<LoginSchema>({
        mode: 'onTouched',
        resolver: zodResolver(loginSchema)
    });
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const onSubmit = async (data: LoginSchema) => {
        setLoginError(null);
        try {
            await login(data).unwrap();
            await fetchUserInfo();
            navigate(location.state?.from || '/catalog');
        } catch (error: any) {
            setLoginError(error?.data?.message || 'Erro ao fazer login. Verifique as credenciais.');
        }
    }

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoginError(null);
        try {
            // Send the Google token to your backend for verification
            const response = await fetch('/api/account/google-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: credentialResponse.credential }),
                credentials: 'include'
            });
            
            if (response.ok) {
                await fetchUserInfo();
                navigate(location.state?.from || '/catalog');
            } else {
                setLoginError('Erro ao fazer login com Google');
            }
        } catch (error) {
            setLoginError('Erro ao fazer login com Google');
        }
    }

    const handleGoogleError = () => {
        setLoginError('Erro ao fazer login com Google');
    } 

    return (
        <Container
            component={Paper}
            maxWidth='sm'
            sx={{
                mt: { xs: 8, md: 10 },
                borderRadius: 3,
                p: { xs: 2, sm: 4 },
                boxSizing: 'border-box',
                backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : undefined
            }}
        >
            <Box display='flex' flexDirection='column' alignItems='center' mt={3}>
                <LockOutlined sx={{ mt: 1, color: isLight ? 'text.primary' : 'secondary.main', fontSize: 40 }} />
                <Typography variant="h5">
                    Inicio de Sessão
                </Typography>
                
                {loginError && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {loginError}
                    </Alert>
                )}

                <Box
                    component='form'
                    onSubmit={handleSubmit(onSubmit)}
                    width='100%'
                    display='flex'
                    flexDirection='column'
                    gap={3}
                    marginY={3}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        label='Username or email'
                        {...register('identifier')}
                        error={!!errors.identifier}
                        helperText={errors.identifier?.message}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'transparent',
                                '& fieldset': { borderColor: 'divider !important' },
                                '&:hover fieldset': { borderColor: 'text.primary !important' },
                                '&.Mui-focused fieldset': { borderColor: 'primary.main !important' }
                            }
                        }}
                    />
                    <TextField
                        fullWidth
                        variant="outlined"
                        label='Password'
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton edge="end" onClick={() => setShowPassword(s => !s)}>
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'transparent',
                                '& fieldset': { borderColor: 'divider !important' },
                                '&:hover fieldset': { borderColor: 'text.primary !important' },
                                '&.Mui-focused fieldset': { borderColor: 'primary.main !important' }
                            }
                        }}
                    />
                    <Typography sx={{ textAlign: 'right' }} >
                        <Link to='/forgot-password'>Esqueci-me da password</Link>
                    </Typography>
                    <LoadingButton
                        loading={isLoading}
                        type="submit"
                        variant="contained"
                        disableElevation={isLight}
                        fullWidth
                        sx={isLight ? { '&:hover': { backgroundColor: 'grey.800 !important' } } : {}}
                        style={isLight ? { backgroundColor: theme.palette.grey[900], color: theme.palette.common.white } : undefined}
                    >
                        Login
                    </LoadingButton>

                    <Divider sx={{ my: 2 }}>ou</Divider>

                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            size="large"
                        />
                    </Box>

                    <Typography sx={{ textAlign: 'center' }}>
                        Ainda não tem uma conta?
                        <Typography
                            sx={{ ml: 2, color: isLight ? 'text.primary' : 'secondary.main', textDecoration: 'none' }}
                            component={Link}
                            to='/register'
                        >
                            Registar-se
                        </Typography>
                    </Typography>
                </Box>
            </Box>
        </Container>
    )
}