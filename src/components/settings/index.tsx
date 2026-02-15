'use client';

import {
  type MouseEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useColorScheme } from '@mui/material';

type ThemeOption = 'system' | 'light' | 'dark';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const Settings = () => {
  const { mode, setMode } = useColorScheme();
  const locale = useLocale();
  const router = useRouter();
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('settings');
  const languageOptions = useMemo(
    () => [
      { value: 'pt-BR', label: t('languages.ptBR') },
      { value: 'en-US', label: t('languages.enUS') },
      { value: 'es', label: t('languages.es') },
    ],
    [t]
  );
  useEffect(() => {
    setSelectedLocale(locale);
  }, [locale]);

  const handleModeChange = (
    _event: MouseEvent<HTMLElement>,
    nextMode: ThemeOption | null
  ) => {
    if (!nextMode) return;
    if (nextMode === mode) return;
    setMode(nextMode);
  };

  const handleLocaleChange = (event: SelectChangeEvent<string>) => {
    const nextLocale = event.target.value;
    if (!nextLocale || nextLocale === selectedLocale) return;


    setSelectedLocale(nextLocale);

    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLocale)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      router.refresh();
    });

    try {
      localStorage.setItem('app-locale', nextLocale);
    } catch (error) {
      console.warn('Unable to persist locale preference', error);
    }
  };

  const selectedLanguageLabel = useMemo(() => {
    const option = languageOptions.find(
      (item) => item.value === selectedLocale
    );
    return option?.label ?? selectedLocale;
  }, [selectedLocale, languageOptions]);

  if (!mode) {
    return null;
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 }, maxWidth: 720, mx: 'auto' }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('description')}
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" component="h2">
                  {t('theme.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('theme.description')}
                </Typography>
              </Box>

              <ToggleButtonGroup
                color="primary"
                exclusive
                value={mode}
                onChange={handleModeChange}
                size="large"
              >
                <ToggleButton value="system">{t('theme.options.system')}</ToggleButton>
                <ToggleButton value="light">{t('theme.options.light')}</ToggleButton>
                <ToggleButton value="dark">{t('theme.options.dark')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" component="h2">
                  {t('language.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('language.description')}
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel id="language-select-label">{t('language.label')}</InputLabel>
                <Select
                  labelId="language-select-label"
                  label={t('language.label')}
                  value={selectedLocale}
                  onChange={handleLocaleChange}
                  disabled={isPending}
                >
                  {languageOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider flexItem />

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {t('language.current')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedLanguageLabel}
                </Typography>
                {isPending && <CircularProgress size={18} />}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default Settings;
