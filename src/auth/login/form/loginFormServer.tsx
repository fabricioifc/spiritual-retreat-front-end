'use client';

import React, { useActionState } from 'react';

import { useSearchParams } from 'next/navigation';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  Avatar,
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import { loginServerAction } from '@/src/actions/login-server';

import { FormError } from '../../FormError';
import { SubmitButton } from './SubmitButton';

type LoginState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const initialState: LoginState = {
  message: '',
  errors: {},
};

async function loginActionWrapper(
  prevState: LoginState | undefined,
  formData: FormData
) {
  return await loginServerAction(formData);
}

export default function LoginFormServer() {
  const [state, formAction] = useActionState(loginActionWrapper, initialState);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  return (
    <Paper
      elevation={0} // Elevation 0 para mesclar melhor com o fundo branco do Grid direito
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
        Entrar
      </Typography>

      <Box component="form" action={formAction} sx={{ mt: 1, width: '100%' }}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          name="email"
          label="Endereço de Email"
          autoComplete="email"
          autoFocus
          error={!!state?.errors?.email}
          helperText={state?.errors?.email?.[0]}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Senha"
          type="password"
          id="password"
          autoComplete="current-password"
          error={!!state?.errors?.password}
          helperText={state?.errors?.password?.[0]}
        />

        <FormControlLabel
          control={<Checkbox name="remember" value="yes" color="primary" />}
          label="Lembrar-me"
        />

        <SubmitButton />

        <Grid container sx={{ mt: 2 }}>
          <Grid>
            <Link href="/forgot-password" variant="body2">
              Esqueceu a senha?
            </Link>
          </Grid>
        </Grid>

        {state?.message && (
          <Box mt={2}>
            <FormError message={state.message} />
          </Box>
        )}
      </Box>
    </Paper>
  );
}
