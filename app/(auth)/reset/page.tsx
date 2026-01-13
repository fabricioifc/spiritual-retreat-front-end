import { Paper, Typography } from '@mui/material';

import ResetPassword from '@/src/components/public/resetPassword';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ResetPasswordPage(props: Props) {
  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === 'string' ? searchParams.token : '';

  return (
    <Paper sx={{ p: 4, maxWidth: 400, margin: 'auto', mt: 8 }}>
      <Typography variant="h5" gutterBottom>
        Redefina sua senha
      </Typography>

      <ResetPassword token={token} />
    </Paper>
  );
}
