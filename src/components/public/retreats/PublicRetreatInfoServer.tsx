import { Chip, Grid } from '@mui/material';

import { auth } from '@/auth';
import { Retreat } from '@/src/types/retreats';

import PublicRetreatInfo from './PublicRetreatInfo';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default async function PublicRetreatInfoServer({
  retreatId,
}: {
  retreatId: string;
}) {
  const session = await auth();

  try {
    const response = await fetch(`${BACKEND_URL}/Retreats/${retreatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.tokens?.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        `Erro HTTP ${response.status}: ${response.statusText}`,
        await response.text()
      );
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const retreat = (await response.json()) as Retreat;
    console.warn('Retreat data loaded:', retreatId, retreat);

    if (!retreat) {
      return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <Chip color="error" label="Falha ao carregar retiro" />
          </Grid>
        </Grid>
      );
    }

    return <PublicRetreatInfo retreat={retreat} />;
  } catch (error) {
    console.error('Erro ao carregar retiro:', error);
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <Chip color="error" label="Falha ao carregar retiro" />
        </Grid>
      </Grid>
    );
  }
}
