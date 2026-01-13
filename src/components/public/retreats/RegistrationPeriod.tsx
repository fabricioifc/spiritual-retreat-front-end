'use client';

import { useEffect, useState } from 'react';

import { Alert, Box, Chip, LinearProgress, Typography } from '@mui/material';

import Iconify from '@/src/components/Iconify';

interface RegistrationPeriodProps {
  registrationStart: string;
  registrationEnd: string;
  onRegistrationStatusChange?: (
    status: 'not-started' | 'open' | 'ending-soon' | 'ended'
  ) => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export default function RegistrationPeriod({
  registrationStart,
  registrationEnd,
  onRegistrationStatusChange,
}: RegistrationPeriodProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );
  const [registrationStatus, setRegistrationStatus] = useState<
    'not-started' | 'open' | 'ending-soon' | 'ended'
  >('open');
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(registrationStart).getTime();
      const end = new Date(registrationEnd).getTime();

      // Determina o status
      let status: 'not-started' | 'open' | 'ending-soon' | 'ended' = 'open';

      if (now < start) {
        status = 'not-started';
      } else if (now > end) {
        status = 'ended';
      } else {
        // Inscrições estão abertas
        const remaining = end - now;
        const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;

        if (remaining <= tenDaysInMs) {
          status = 'ending-soon';
        } else {
          status = 'open';
        }
      }

      setRegistrationStatus(status);
      onRegistrationStatusChange?.(status);

      // Calcula tempo restante
      let timeMs = 0;
      if (status === 'not-started') {
        timeMs = start - now;
      } else if (status === 'open' || status === 'ending-soon') {
        timeMs = end - now;
      }

      if (timeMs > 0) {
        const days = Math.floor(timeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          totalSeconds: timeMs,
        });

        // Calcula progresso (baseado no período total de inscrição)
        const totalPeriod = end - start;
        const progressPercent = ((end - now) / totalPeriod) * 100;
        setProgress(Math.max(0, Math.min(100, progressPercent)));
      } else {
        setTimeRemaining(null);
        setProgress(0);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [registrationStart, registrationEnd, onRegistrationStatusChange]);

  const getStatusConfig = () => {
    switch (registrationStatus) {
      case 'not-started':
        return {
          color: 'info' as const,
          title: 'Inscrições não iniciadas',
          icon: 'solar:clock-bold',
          message: 'As inscrições ainda não começaram',
        };
      case 'open':
        return {
          color: 'success' as const,
          title: 'Inscrições abertas',
          icon: 'solar:check-circle-bold',
          message: 'Período de inscrição está aberto',
        };
      case 'ending-soon':
        return {
          color: 'warning' as const,
          title: 'Inscrições encerrando em breve',
          icon: 'solar:bell-bold',
          message: 'Faltam poucos dias para o fim das inscrições',
        };
      case 'ended':
        return {
          color: 'error' as const,
          title: 'Inscrições encerradas',
          icon: 'solar:close-circle-bold',
          message: 'O período de inscrição foi encerrado',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          p: 2,
          borderRadius: 2,
          bgcolor:
            registrationStatus === 'ended'
              ? 'error.lighter'
              : registrationStatus === 'ending-soon'
                ? 'warning.lighter'
                : registrationStatus === 'open'
                  ? 'success.lighter'
                  : 'info.lighter',
          border: '1px solid',
          borderColor:
            registrationStatus === 'ended'
              ? 'error.light'
              : registrationStatus === 'ending-soon'
                ? 'warning.light'
                : registrationStatus === 'open'
                  ? 'success.light'
                  : 'info.light',
        }}
      >
        <Iconify
          icon={config.icon}
          width={32}
          sx={{
            color:
              registrationStatus === 'ended'
                ? 'error.main'
                : registrationStatus === 'ending-soon'
                  ? 'warning.main'
                  : registrationStatus === 'open'
                    ? 'success.main'
                    : 'info.main',
          }}
        />

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {config.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {config.message}
          </Typography>
        </Box>
      </Box>

      {/* Timeline visual */}
      {timeRemaining && registrationStatus !== 'ended' && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {registrationStatus === 'not-started'
                ? 'Faltam'
                : 'Tempo restante'}
            </Typography>
            <Chip
              label={`${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`}
              size="small"
              color={
                registrationStatus === 'ending-soon' ? 'warning' : 'success'
              }
              variant="filled"
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor:
                registrationStatus === 'ending-soon'
                  ? 'warning.lighter'
                  : 'success.lighter',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor:
                  registrationStatus === 'ending-soon'
                    ? 'warning.main'
                    : 'success.main',
              },
            }}
          />
        </Box>
      )}

      {/* Data detalhada */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            Início das inscrições
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {new Date(registrationStart).toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(registrationStart).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            Fim das inscrições
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {new Date(registrationEnd).toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(registrationEnd).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>
      </Box>

      {/* Alerta se inscrições encerraram */}
      {registrationStatus === 'ended' && (
        <Alert
          severity="error"
          icon={<Iconify icon="solar:close-circle-bold" />}
        >
          <Typography variant="body2" fontWeight="bold">
            As inscrições para este retiro foram encerradas.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Entre em contato com o administrador para mais informações.
          </Typography>
        </Alert>
      )}

      {/* Alerta se está encerrando em breve */}
      {registrationStatus === 'ending-soon' && timeRemaining && (
        <Alert severity="warning" icon={<Iconify icon="solar:bell-bold" />}>
          <Typography variant="body2" fontWeight="bold">
            ⚠️ Faltam apenas {timeRemaining.days}
            {timeRemaining.days === 1 ? ' dia' : ' dias'} e{' '}
            {timeRemaining.hours}
            {timeRemaining.hours === 1 ? ' hora' : ' horas'} para o fim das
            inscrições!
          </Typography>
        </Alert>
      )}

      {/* Alerta se inscrições ainda não iniciaram */}
      {registrationStatus === 'not-started' && timeRemaining && (
        <Alert severity="info" icon={<Iconify icon="solar:clock-bold" />}>
          <Typography variant="body2">
            As inscrições começarão em{' '}
            <strong>
              {timeRemaining.days}
              {timeRemaining.days === 1 ? ' dia' : ' dias'} e{' '}
              {timeRemaining.hours}
              {timeRemaining.hours === 1 ? ' hora' : ' horas'}
            </strong>
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
