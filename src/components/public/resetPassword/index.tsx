'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';

import { Alert, Box, Button, CircularProgress, TextField } from '@mui/material';

import { FormError } from '@/src/auth/FormError';
import { FormSuccess } from '@/src/auth/FormSuccess';

import { type ResetPasswordInput, resetPasswordSchema } from './schema';

interface ResetPasswordProps {
  token: string;
}

export default function ResetPassword({ token }: ResetPasswordProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setErrorMessage(
        'Token inválido. Solicite uma nova redefinição de senha.'
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message || 'Erro ao redefinir senha. Tente novamente.'
        );
        return;
      }

      setSuccessMessage(
        'Senha redefinida com sucesso! Redirecionando para login...'
      );
      reset();

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      setErrorMessage(
        'Erro ao conectar com o servidor. Tente novamente mais tarde.'
      );
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Alert severity="error">
        Token inválido ou expirado. Solicite uma nova redefinição de senha.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Nova Senha"
        type="password"
        id="password"
        autoComplete="new-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        disabled={isLoading}
        {...register('password')}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        label="Confirmar Senha"
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        disabled={isLoading}
        {...register('confirmPassword')}
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
            Redefinindo...
          </>
        ) : (
          'Redefinir Senha'
        )}
      </Button>
    </Box>
  );
}
