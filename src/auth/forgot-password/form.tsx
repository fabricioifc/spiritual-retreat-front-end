'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import { FormError } from '../FormError';
import { FormSuccess } from '../FormSuccess';
import { type ForgotPasswordInput, forgotPasswordSchema } from './schema';

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message ||
            'Erro ao solicitar redefinição de senha. Tente novamente.'
        );
        return;
      }

      setSuccessMessage(
        'Verifique seu email para as instruções de redefinição de senha.'
      );
      reset();
    } catch (error) {
      setErrorMessage(
        'Erro ao conectar com o servidor. Tente novamente mais tarde.'
      );
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
        <LockOutlinedIcon />
      </Avatar>

      <Typography component="h1" variant="h5">
        Recuperar Senha
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Insira seu email para receber instruções de redefinição de senha
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ mt: 1, width: '100%' }}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Endereço de Email"
          autoComplete="email"
          autoFocus
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={isLoading}
          {...register('email')}
        />

        {successMessage && (
          <Box mt={2}>
            <FormSuccess message={successMessage} />
          </Box>
        )}

        {errorMessage && (
          <Box mt={2}>
            <FormError message={errorMessage} />
          </Box>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Enviando...
            </>
          ) : (
            'Enviar'
          )}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link href="/login" variant="body2">
            Voltar para Login
          </Link>
        </Box>
      </Box>
    </Paper>
  );
}
