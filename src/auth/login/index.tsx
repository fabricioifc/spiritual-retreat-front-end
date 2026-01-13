'use client';

import Image from 'next/image';

import { Box, Grid } from '@mui/material';

import LoginFormServer from './form/loginFormServer';

export default function LoginPageContent() {
  return (
    <Grid
      container
      component="main"
      sx={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Lado Esquerdo - Imagem */}
      <Grid
        size={{ xs: 0, sm: 4, md: 7 }} // Oculta em mobile (xs:0), mostra em maiores
        sx={{
          position: 'relative',
          backgroundImage: 'url(/images/background16-9.png)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[50]
              : theme.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <Image
            src="/images/background16-9.png"
            alt="Background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </Box>
      </Grid>

      {/* Lado Direito - O Formulário */}
      <Grid
        size={{ xs: 12, sm: 8, md: 5 }}
        component={Box} // O Grid age como um Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          height: '100%',
          px: 4,
        }}
      >
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '450px',
          }}
        >
          <LoginFormServer />
        </Box>
      </Grid>
    </Grid>
  );
}
