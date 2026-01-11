'use client';

import { useRouter } from 'next/navigation';

import { Box, Button, Paper, Typography } from '@mui/material';

import Iconify from '@/src/components/Iconify';

export default function NoPermissionWarning() {
  const router = useRouter();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="calc(100vh - 200px)"
      p={3}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Iconify
            icon="solar:shield-warning-bold"
            width={80}
            sx={{ color: 'warning.main' }}
          />
        </Box>

        <Typography variant="h5" gutterBottom fontWeight="bold">
          Acesso Negado
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Você não possui permissão para acessar esta página. Entre em contato
          com o administrador do sistema se acredita que isso é um erro.
        </Typography>

        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
            onClick={() => router.back()}
          >
            Voltar
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:home-bold" />}
            onClick={() => router.push('/dashboard')}
          >
            Ir para Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
