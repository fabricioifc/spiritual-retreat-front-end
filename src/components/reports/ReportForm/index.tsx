'use client';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useSnackbar } from 'notistack';

import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import Iconify from '@/src/components/Iconify';
import apiClient from '@/src/lib/axiosClientInstance';

import { RetreatSimpleRequest } from '../../retreats/types';
import { AsynchronousAutoComplete } from '../../select-auto-complete/AsynchronousAutoComplete';

interface RetreatOption {
  label: string;
  value: string;
  id: string;
}

interface ReportTemplate {
  key: string;
  defaultTitle: string;
  columns: Array<{ key: string; label: string }>;
  summaryKeys: string[];
  supportsPaging: boolean;
  defaultPageLimit: number;
}

interface ReportType {
  value: string;
  label: string;
  columns?: Array<{ key: string; label: string }>;
}

const fetchReportTemplates = async (): Promise<ReportTemplate[]> => {
  try {
    const response = await apiClient.get('/reports/templates');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return [];
  }
};

const fetchRetreats = async (query: string): Promise<RetreatOption[]> => {
  try {
    const response = await apiClient.get<RetreatSimpleRequest>('/Retreats', {
      params: {
        status: 1,
        skip: 0,
        take: 50,
        search: query || undefined,
      },
    });

    const retreats = response.data.items || [];
    return retreats.map((retreat) => ({
      label: retreat.name || `Retiro ${retreat.id}`,
      value: retreat.id,
      id: retreat.id,
    }));
  } catch (error) {
    console.error('Error fetching retreats:', error);
    return [];
  }
};

export default function ReportForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [formValues, setFormValues] = useState({
    name: '',
    retreat: null as RetreatOption | null,
    reportType: '',
    icon: 'mdi:file-document',
    iconColor: '#179B0B',
  });

  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const templates = await fetchReportTemplates();
        setReportTemplates(templates);

        // Transform templates into select options
        const options = templates.map((template) => ({
          value: template.key,
          label: template.defaultTitle,
          columns: template.columns,
        }));
        setReportTypes(options);
      } catch (error) {
        console.error('Failed to load report templates:', error);
        enqueueSnackbar('Erro ao carregar tipos de relatório', {
          variant: 'error',
        });
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [enqueueSnackbar]);

  // const handleColorChange = (color: string) => {
  //   setFormValues({
  //     ...formValues,
  //     iconColor: color,
  //   });
  // };

  const handleReportTypeChange = (value: string) => {
    setFormValues({ ...formValues, reportType: value });
  };

  const getSelectedTemplateColumns = (): Array<{
    key: string;
    label: string;
  }> | null => {
    const selectedTemplate = reportTemplates.find(
      (template) => template.key === formValues.reportType
    );
    return selectedTemplate?.columns || null;
  };

  const handleSubmit = async () => {
    if (!formValues.name || !formValues.reportType || !formValues.retreat) {
      enqueueSnackbar('Preencha todos os campos obrigatórios', {
        variant: 'warning',
      });
      return;
    }

    const columns = getSelectedTemplateColumns();
    if (!columns) {
      enqueueSnackbar('Template de relatório inválido', { variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      enqueueSnackbar('Relatório criado com sucesso!', { variant: 'success' });
      // router.push(`/reports/${response.id}`)
      // Reset form
      setFormValues({
        name: '',
        retreat: null,
        reportType: '',
        icon: 'mdi:file-document',
        iconColor: '#179B0B',
      });
    } catch (error) {
      console.error('Error creating report:', error);
      enqueueSnackbar('Erro ao criar relatório', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{ p: 4, bgcolor: 'background.default', borderRadius: 2 }}
      >
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Iconify icon="solar:document-bold" width={24} height={24} />
          <Typography variant="h6" sx={{ ml: 1 }}>
            Novo Modelo de Relatório
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Name */}
          <Grid size={{ xs: 12, md: 6 }}>
            <InputLabel shrink sx={{ mb: 1, fontSize: '0.875rem' }}>
              Nome do Relatório *
            </InputLabel>
            <TextField
              fullWidth
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
              variant="outlined"
              size="small"
              placeholder="Ex: Camisetas, Lista de Presença"
              sx={{ bgcolor: 'background.default' }}
              disabled={isSubmitting}
            />
          </Grid>

          {/* Report Type */}
          <Grid size={{ xs: 12, md: 6 }}>
            <InputLabel shrink sx={{ mb: 1, fontSize: '0.875rem' }}>
              Tipo de Relatório *
            </InputLabel>
            <FormControl fullWidth size="small">
              <Select
                value={formValues.reportType}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                displayEmpty
                disabled={loadingTemplates || isSubmitting}
                sx={{ bgcolor: 'background.default' }}
              >
                <MenuItem value="" disabled>
                  {loadingTemplates ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <span>Carregando...</span>
                    </Box>
                  ) : (
                    'Selecione o tipo'
                  )}
                </MenuItem>
                {reportTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Retreat */}
          <Grid size={{ xs: 12 }}>
            <InputLabel shrink sx={{ mb: 1, fontSize: '0.875rem' }}>
              Retiro *
            </InputLabel>
            <AsynchronousAutoComplete<RetreatOption>
              fetchOptions={fetchRetreats}
              value={formValues.retreat}
              onChange={(value) =>
                setFormValues({
                  ...formValues,
                  retreat: value as RetreatOption | null,
                })
              }
              label=""
              placeholder="Buscar retiro..."
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              textFieldProps={{
                size: 'small',
                disabled: isSubmitting,
              }}
            />
          </Grid>
        </Grid>

        {/* Footer with buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mt: 4,
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            sx={{ px: 3 }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              bgcolor: '#FF9800',
              '&:hover': { bgcolor: '#F57C00' },
              px: 3,
            }}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
