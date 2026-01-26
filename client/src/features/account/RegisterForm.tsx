import { useForm } from "react-hook-form";
import { useRegisterMutation, useLazyUserInfoQuery } from "./accountApi"
import { registerSchema, RegisterSchema } from "../../lib/schemas/registerSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { Container, Paper, Box, Typography, TextField, IconButton, InputAdornment, useTheme, Alert, Divider } from "@mui/material";
import { LoadingButton } from '@mui/lab';
import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { hasGoogleClientId } from "../../app/config/env";

export default function RegisterForm() {
    const [registerUser, { isLoading }] = useRegisterMutation();
    const [fetchUserInfo] = useLazyUserInfoQuery();
    const navigate = useNavigate();
    const {register, handleSubmit, setError, formState: {errors, isValid}} = useForm<RegisterSchema>({
        mode: 'onTouched',
        resolver: zodResolver(registerSchema)
    })

    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';

    const [showPassword, setShowPassword] = useState(false);
    const [registerError, setRegisterError] = useState<string | null>(null);

    const onSubmit = async (data: RegisterSchema) => {
        setRegisterError(null);
        try {
            await registerUser(data).unwrap();
            await fetchUserInfo();
            navigate('/catalog');
        } catch (error) {
            const apiError = error as {message: string};
            if (apiError.message && typeof apiError.message === 'string') {
                const errorArray = apiError.message.split(',');

                errorArray.forEach(e => {
                    if (e.includes('Password')) {
                        setError('password', {message: e})
                    } else if (e.includes('Email')) {
                        setError('email', {message: e})
                    }
                })
            }
        }

    }

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setRegisterError(null);
        try {
            // Send the Google token to your backend for verification
            const response = await fetch('/api/account/google-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: credentialResponse.credential }),
                credentials: 'include'
            });
            
            if (response.ok) {
                await fetchUserInfo();
                navigate('/catalog');
            } else {
                setRegisterError('Erro ao registar com Google');
            }
        } catch (error) {
            setRegisterError('Erro ao registar com Google');
        }
    }

    const handleGoogleError = () => {
        setRegisterError('Erro ao registar com Google');
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
                    Registar
                </Typography>
                
                {registerError && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {registerError}
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
                        label='Email'
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
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
                    <LoadingButton
                        loading={isLoading}
                        disabled={!isValid}
                        variant="contained"
                        type="submit"
                        fullWidth
                        disableElevation={isLight}
                        sx={isLight ? { '&:hover': { backgroundColor: 'grey.800 !important' } } : {}}
                        style={isLight ? { backgroundColor: theme.palette.grey[900], color: theme.palette.common.white } : undefined}
                    >
                        Registar
                    </LoadingButton>

                    <Divider sx={{ my: 2 }}>ou</Divider>

                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        {hasGoogleClientId ? (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                size="large"
                            />
                        ) : (
                            <Alert severity="warning" sx={{ width: '100%' }}>
                                Registo com Google não está configurado (VITE_GOOGLE_CLIENT_ID em falta).
                            </Alert>
                        )}
                    </Box>

                    <Typography sx={{ textAlign: 'center' }}>
                        Já tem uma conta?
                        <Typography sx={{ ml: 2, color: isLight ? 'text.primary' : 'primary.main', textDecoration: 'none' }} component={Link} to='/login'>
                            Iniciar sessão aqui
                        </Typography>
                    </Typography>
                </Box>
            </Box>
        </Container>
    )
}