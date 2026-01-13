'use client';

import { useState } from 'react';

import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import { Retreat } from '@/src/types/retreats';

import { Status, StatusChip } from '../../chip/StatusChip';
import { PublicRetreatRegistrationActions } from './PublicRetreatRegistrationActions';
import RegistrationPeriod from './RegistrationPeriod';
import { ImageCarrousel } from './image-carrousel';

interface PublicRetreatInfoProps {
  retreat: Retreat;
}

export default function PublicRetreatInfo({ retreat }: PublicRetreatInfoProps) {
  const [registrationStatus, setRegistrationStatus] = useState<
    'not-started' | 'open' | 'ending-soon' | 'ended'
  >('open');

  return (
    <Box sx={{ m: 2 }}>
      <Grid maxWidth={'lg'} container spacing={2} sx={{ mt: 1, m: 'auto' }}>
        <Grid size={{ xs: 12 }}>
          <StatusChip
            sx={{ minWidth: 100 }}
            status={retreat.status as Status}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h3">{retreat.name}</Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="body2">{retreat.description}</Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <ImageCarrousel images={retreat.images ?? []} aspectRatio={16 / 9} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <RegistrationPeriod
            registrationStart={retreat.registrationStart}
            registrationEnd={retreat.registrationEnd}
            onRegistrationStatusChange={setRegistrationStatus}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              display: 'flex',
              minWidth: 200,
              maxWidth: '30%',
              borderRadius: 2,
              borderColor: 'divider',
              borderWidth: 1,
              borderStyle: 'solid',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 50,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                p: 2,
                m: 2,
              }}
            >
              <Typography variant="h5">👨</Typography>
            </Box>
            <Box>
              <Typography variant="h5">Anunciante</Typography>
              <Typography variant="h4">{retreat.instructor}</Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="h5">Descrição</Typography>
            <Typography variant="body1">{retreat.description}</Typography>
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12 }}
          sx={{
            position: 'sticky',
            bottom: 10,
            zIndex: 1000,
          }}
        >
          <PublicRetreatRegistrationActions
            retreatId={retreat.id.toString()}
            registrationDisabled={registrationStatus === 'ended'}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
