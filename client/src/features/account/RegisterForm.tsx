import { useForm } from "react-hook-form";
import { useRegisterMutation } from "./accountApi"
import { registerSchema, RegisterSchema } from "../../lib/schemas/registerSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { Container, Paper, Box, Typography, TextField, Button, IconButton, InputAdornment } from "@mui/material";
import { useState } from 'react';
import { Link } from "react-router-dom";

export default function RegisterForm() {
    const [registerUser] = useRegisterMutation();
    const {register, handleSubmit, setError, formState: {errors, isValid, isLoading}} = useForm<RegisterSchema>({
        mode: 'onTouched',
        resolver: zodResolver(registerSchema)
    })

    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (data: RegisterSchema) => {
        try {
            await registerUser(data).unwrap();
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

    return (
        <Container component={Paper} maxWidth='sm' sx={{ borderRadius: 3 }}>
            <Box display='flex' flexDirection='column' alignItems='center' marginTop='8'>
                <LockOutlined sx={{ mt: 3, color: 'secondary.main', fontSize: 40 }} />
                <Typography variant="h5">
                    Register
                </Typography>
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
                        label='Email'
                        autoFocus
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                    />
                    <TextField
                        fullWidth
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
                    />
                    <Button disabled={isLoading || !isValid} variant="contained" type="submit">
                        Register
                    </Button>
                    <Typography sx={{ textAlign: 'center' }}>
                        Already have an account?
                        <Typography sx={{ ml: 2 }} component={Link} to='/login' color='primary'>
                            Sign in here
                        </Typography>
                    </Typography>
                </Box>
            </Box>
        </Container>
    )
}