'use client';

import { Fragment, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import Iconify from '@/src/components/Iconify';
import apiClient from '@/src/lib/axiosClientInstance';

export interface ParticipantWithoutFamily {
  registrationId: string;
  name: string;
  email?: string;
  gender?: string;
  city?: string;
}

export interface DrawFamiliesResponse {
  items: ParticipantWithoutFamily[];
}

interface DrawFamiliesProps {
  retreatId: string;
  onSuccess?: () => void;
}

const fetchParticipantsWithoutFamily = async (
  retreatId: string
): Promise<ParticipantWithoutFamily[]> => {
  const response = await apiClient.get<DrawFamiliesResponse>(
    `/retreats/${retreatId}/families/unassigned`
  );

  return response.data?.items ?? [];
};

const drawFamiliesRequest = async (
  retreatId: string,
  count: number,
  clearExisting: boolean,
  fillExistingFirst: boolean
) => {
  const response = await apiClient.post(
    `/retreats/${retreatId}/families/generate`,
    {
      membersPerFamily: count,
      replaceExisting: clearExisting,
      fillExistingFirst,
    }
  );

  return response.data;
};

export default function DrawFamilies({
  retreatId,
  onSuccess,
}: DrawFamiliesProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(4);
  const [clearExisting, setClearExisting] = useState(true);
  const [fillExistingFirst, setFillExistingFirst] = useState(true);

  const {
    data: participants,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: ['retreat-families-unassigned', retreatId],
    queryFn: () => fetchParticipantsWithoutFamily(retreatId),
    staleTime: 30_000,
  });

  const drawMutation = useMutation({
    mutationFn: () =>
      drawFamiliesRequest(retreatId, count, clearExisting, fillExistingFirst),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['retreat-families-unassigned', retreatId],
      });
      queryClient.invalidateQueries({ queryKey: ['retreat-families'] });
      onSuccess?.();
    },
  });

  const totalParticipants = participants?.length ?? 0;
  const isDrawDisabled = totalParticipants === 0 || drawMutation.isPending;

  const title = useMemo(() => {
    if (isLoading) return t('loading-participants');
    return t('participants-without-family');
  }, [isLoading, t]);

  return (
    <Box sx={{ width: '100%', minHeight: 280 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('participants-without-family-description')}
          </Typography>
        </Box>

        {isLoading && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                {t('retry')}
              </Button>
            }
          >
            {error instanceof Error
              ? error.message
              : t('failed-to-load-participants')}
          </Alert>
        )}

        {!isLoading && !isError && (
          <Box
            sx={{
              maxHeight: 320,
              overflowY: 'auto',
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            {totalParticipants === 0 ? (
              <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
                <Iconify
                  icon="solar:user-cross-bold"
                  width={48}
                  height={48}
                  color="text.disabled"
                />
                <Typography variant="body2" color="text.secondary">
                  {t('no-unassigned-participants')}
                </Typography>
              </Stack>
            ) : (
              <List disablePadding>
                {participants?.map((participant, index) => (
                  <Fragment key={participant.registrationId}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          {participant.name
                            ?.split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={participant.name}
                        secondary={
                          <Stack spacing={0.5}>
                            {participant.email && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {participant.email}
                              </Typography>
                            )}
                            {participant.email && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {participant.email}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < totalParticipants - 1 && (
                      <Divider component="li" />
                    )}
                  </Fragment>
                ))}
              </List>
            )}
          </Box>
        )}

        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="number"
              label={t('family-capacity')}
              value={count}
              onChange={(e) => {
                const parsedValue = parseInt(e.target.value, 10);
                const normalizedValue = Number.isNaN(parsedValue)
                  ? 4
                  : Math.min(20, Math.max(4, parsedValue));
                setCount(normalizedValue);
              }}
              inputProps={{ min: 4, max: 20 }}
              helperText="Allowed range: 4 to 20"
              size="small"
              sx={{ width: { xs: '100%', sm: 200 } }}
            />
          </Stack>
          <FormControlLabel
            control={
              <Checkbox
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
              />
            }
            label={t('clear-existing-families')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fillExistingFirst}
                onChange={(e) => setFillExistingFirst(e.target.checked)}
              />
            }
            label={t('fill-existing-first')}
          />
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            {t('unassigned-participants-count', { count: totalParticipants })}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => drawMutation.mutate()}
            disabled={isDrawDisabled}
            startIcon={
              drawMutation.isPending ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <Iconify icon="solar:shuffle-outline" />
              )
            }
          >
            {drawMutation.isPending ? t('drawing') : t('start-family-draw')}
          </Button>
        </Stack>

        {drawMutation.isError && (
          <Alert severity="error">
            {drawMutation.error instanceof Error
              ? drawMutation.error.message
              : t('failed-to-draw-families')}
          </Alert>
        )}

        {drawMutation.isSuccess && (
          <Alert severity="success">{t('families-draw-success')}</Alert>
        )}
      </Stack>
    </Box>
  );
}
