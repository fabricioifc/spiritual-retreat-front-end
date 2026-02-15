import Link from 'next/link';

import { Box, Button, Stack } from '@mui/material';

interface ReportRetreatLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ReportRetreatLayout({
  children,
}: ReportRetreatLayoutProps) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ px: 3, pt: 2, pb: 1 }}>
        <Button
          component={Link}
          href="/reports"
          variant="outlined"
          size="small"
        >
          Voltar para lista
        </Button>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Box>
  );
}
