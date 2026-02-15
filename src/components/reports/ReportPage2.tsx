/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import RetreatsTablePage from '@/src/components/retreats';
import RetreatsCardTable from '@/src/components/retreats/CardTable/RetreatsCardTable';
import { RetreatSimple } from '@/src/components/retreats/types';
import { TanStackTable } from '@/src/components/table';
import apiClient from '@/src/lib/axiosClientInstance';
import LoadingScreenCircular from '@/src/components/loading-screen/client/LoadingScreenCircular';

type ReportTemplate = {
  key: string;
  title: string;
  description: string;
  category: string;
  hasData: boolean;
  estimatedRecords: number;
};

type ReportColumn = {
  key: string;
  label: string;
};

type ReportGenerateResponse = {
  report: {
    templateKey: string;
    title: string;
    category: string;
    generatedAt: string;
    retreatId: string;
    retreatName: string;
  };
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary: Record<string, unknown>;
  total: number;
  page: number;
  pageLimit: number;
};

const DEFAULT_PAGE_LIMIT = 50;

const formatObjectValue = (objectValue: Record<string, unknown>): string => {
  const severity =
    typeof objectValue.severity === 'string' ? objectValue.severity : undefined;
  const code = typeof objectValue.code === 'string' ? objectValue.code : undefined;
  const message =
    typeof objectValue.message === 'string' ? objectValue.message : undefined;

  // Common validation shape: { code, severity, message }
  if (message) {
    const prefixParts = [severity, code].filter(Boolean);
    return prefixParts.length ? `[${prefixParts.join(' | ')}] ${message}` : message;
  }

  return (
    (typeof objectValue.name === 'string' && objectValue.name) ||
    (typeof objectValue.title === 'string' && objectValue.title) ||
    (typeof objectValue.label === 'string' && objectValue.label) ||
    (typeof objectValue.id === 'string' && objectValue.id) ||
    JSON.stringify(objectValue)
  );
};

const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item === null || item === undefined) return '';
        if (typeof item === 'string' || typeof item === 'number') {
          return String(item);
        }
        if (typeof item === 'object') {
          return formatObjectValue(item as Record<string, unknown>);
        }
        return String(item);
      })
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    return formatObjectValue(value as Record<string, unknown>);
  }

  return String(value);
};

export type ReportsRouteCategory = 'all' | 'logistic' | 'people' | 'finance';

const mapRouteCategoryToTemplateCategory = (
  routeCategory: ReportsRouteCategory | undefined
) => {
  switch (routeCategory) {
    case 'logistic':
      return 'logistic';
    case 'people':
      return 'people';
    case 'finance':
      return 'finance';
    case 'all':
    default:
      return 'all';
  }
};

const FamilyReportCards = dynamic<{ reportId: string }>(
  () => import('@/src/components/reports/report/family/FamilyReportCards'),
  { loading: () => <LoadingScreenCircular /> }
);

const FiveMinutesCardList = dynamic<{ reportId: string }>(
  () => import('@/src/components/reports/report/fiveMinutesCard/FiveMinutesCardList'),
  { loading: () => <LoadingScreenCircular /> }
);

const ExitChecklistReport = dynamic<{ reportId: string }>(
  () => import('@/src/components/reports/report/exitChecklist/ExitChecklistReport'),
  { loading: () => <LoadingScreenCircular /> }
);

const TentReport = dynamic<{ reportId: string }>(
  () => import('@/src/components/reports/report/tents/TentReport'),
  { loading: () => <LoadingScreenCircular /> }
);

const RibbonReport = dynamic<{ reportId: string }>(
  () => import('@/src/components/reports/report/ribbons/RibbonReport'),
  { loading: () => <LoadingScreenCircular /> }
);

const normalizeTemplateType = (value?: string) =>
  (value ?? '').toString().trim().toLowerCase();

const isSpecializedTemplate = (templateKey?: string) => {
  const type = normalizeTemplateType(templateKey);
  return [
    'family',
    'families',
    'fiveminutescard',
    'five-minutes-card',
    'exitchecklist',
    'botafora',
    'bota-fora',
    'tents',
    'tentsallocation',
    'ribbons',
    'service-team',
    'serviceteam',
  ].includes(type);
};

const renderSpecializedReport = (
  templateKey: string,
  reportId: string
): ReactNode => {
  const type = normalizeTemplateType(templateKey);
  switch (type) {
    case 'family':
    case 'families':
      return <FamilyReportCards reportId={reportId} />;
    case 'fiveminutescard':
    case 'five-minutes-card':
      return <FiveMinutesCardList reportId={reportId} />;
    case 'exitchecklist':
    case 'botafora':
    case 'bota-fora':
      return <ExitChecklistReport reportId={reportId} />;
    case 'tents':
    case 'tentsallocation':
      return <TentReport reportId={reportId} />;
    case 'ribbons':
    case 'service-team':
    case 'serviceteam':
      return <RibbonReport reportId={reportId} />;
    default:
      return null;
  }
};

async function fetchRetreatTemplates(
  retreatId: string
): Promise<ReportTemplate[]> {
  const response = await apiClient.get<ReportTemplate[]>(
    `/reports/retreats/${retreatId}/templates`
  );
  return Array.isArray(response.data) ? response.data : [];
}

async function fetchGeneratedReport(params: {
  retreatId: string;
  templateKey: string;
  page: number;
  pageSize: number;
}) {
  const response = await apiClient.get<ReportGenerateResponse>(
    `/reports/retreats/${params.retreatId}/generate/${params.templateKey}`,
    {
      params: {
        page: params.page,
        pageSize: params.pageSize,
      },
    }
  );
  return response.data;
}

const ReportRetreatCard = ({
  retreat,
  onSelect,
}: {
  retreat: RetreatSimple;
  onSelect: (retreat: RetreatSimple) => void;
}) => {
  return (
    <Card sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Typography variant="h6">{retreat.name}</Typography>
        {retreat.edition ? (
          <Typography variant="body2" color="text.secondary">
            Edicao: {retreat.edition}
          </Typography>
        ) : null}
        {(retreat.startDate || retreat.endDate) && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {retreat.startDate || '-'} - {retreat.endDate || '-'}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button variant="contained" fullWidth onClick={() => onSelect(retreat)}>
          Ver relatórios
        </Button>
      </CardActions>
    </Card>
  );
};

interface ReportPage2Props {
  routeCategory?: ReportsRouteCategory;
  retreatId?: string;
}

const ReportPage2 = ({ routeCategory = 'all', retreatId }: ReportPage2Props) => {
  const router = useRouter();
  const hasRetreatRoute = Boolean(retreatId);
  const [selectedRetreat, setSelectedRetreat] = useState<RetreatSimple | null>(
    null
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    mapRouteCategoryToTemplateCategory(routeCategory)
  );
  const [viewerPage, setViewerPage] = useState(1);
  const [viewerPageSize, setViewerPageSize] = useState(DEFAULT_PAGE_LIMIT);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const useSpecializedViewer = isSpecializedTemplate(selectedTemplateKey || undefined);

  const templatesQuery = useQuery({
    queryKey: ['reports-templates', selectedRetreat?.id],
    queryFn: () => fetchRetreatTemplates(selectedRetreat!.id),
    enabled: Boolean(selectedRetreat?.id),
  });

  const reportQuery = useQuery({
    queryKey: [
      'reports-generate',
      selectedRetreat?.id,
      selectedTemplateKey,
      viewerPage,
      viewerPageSize,
    ],
    queryFn: () =>
      fetchGeneratedReport({
        retreatId: selectedRetreat!.id,
        templateKey: selectedTemplateKey!,
        page: viewerPage,
        pageSize: viewerPageSize,
      }),
    enabled: Boolean(selectedRetreat?.id && selectedTemplateKey && !useSpecializedViewer),
  });

  const categories = useMemo(() => {
    const list = templatesQuery.data ?? [];
    const uniq = new Set<string>();
    list.forEach((t) => {
      if (t.category) uniq.add(t.category);
    });
    return ['all', ...Array.from(uniq)];
  }, [templatesQuery.data]);

  const filteredTemplates = useMemo(() => {
    const list = templatesQuery.data ?? [];
    if (selectedCategory === 'all') return list;
    return list.filter((t) => t.category === selectedCategory);
  }, [selectedCategory, templatesQuery.data]);

  const tableColumns = useMemo(() => {
    const columns = reportQuery.data?.columns ?? [];
    return columns.map((column) => ({
      id: column.key,
      accessorKey: column.key,
      header: column.label,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const value = getValue();
        return formatCellValue(value);
      },
    }));
  }, [reportQuery.data?.columns]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setSelectedCategory(mapRouteCategoryToTemplateCategory(routeCategory));
  }, [routeCategory]);

  useEffect(() => {
    if (!retreatId) return;
    setSelectedRetreat((previous) => {
      if (previous?.id === retreatId) return previous;
      return { id: retreatId, name: '' };
    });
  }, [retreatId]);

  const handleSelectRetreat = (retreat: RetreatSimple) => {
    if (!hasRetreatRoute) {
      router.push(
        `/reports/${retreat.id}/${mapRouteCategoryToTemplateCategory(routeCategory)}`
      );
    }
    setSelectedRetreat(retreat);
    setSelectedTemplateKey(null);
    setSelectedCategory(mapRouteCategoryToTemplateCategory(routeCategory));
    setViewerPage(1);
  };

  const handleSelectTemplate = (templateKey: string) => {
    setSelectedTemplateKey(templateKey);
    setViewerPage(1);
  };

  const handleBackToRetreats = () => {
    router.push('/reports');
    setSelectedRetreat(null);
    setSelectedTemplateKey(null);
  };

  const handleBackToTemplates = () => {
    setSelectedTemplateKey(null);
    setViewerPage(1);
  };

  const handleOpenPreview = async () => {
    if (!selectedRetreat?.id || !selectedTemplateKey) return;
    setPreviewLoading(true);
    try {
      const response = await apiClient.get(
        `/reports/retreats/${selectedRetreat.id}/preview/${selectedTemplateKey}`,
        {
          params: {
            format: 'pdf',
            page: viewerPage,
            pageSize: viewerPageSize,
          },
          responseType: 'blob',
        }
      );

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blobUrl = URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      setPreviewUrl(blobUrl);
      setPreviewOpen(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    if (!selectedRetreat?.id || !selectedTemplateKey) return;
    setExportAnchorEl(null);

    const response = await apiClient.post(
      `/reports/retreats/${selectedRetreat.id}/export`,
      {
        templateKey: selectedTemplateKey,
        format,
        page: viewerPage,
        pageSize: viewerPageSize,
      },
      {
        responseType: 'blob',
      }
    );

    const extension = format === 'xlsx' ? 'xlsx' : format;
    const filename = `${selectedTemplateKey}.${extension}`;
    const blobUrl = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const isStepRetreatSelection = !hasRetreatRoute && !selectedRetreat;
  const isStepTemplateSelection = Boolean(
    selectedRetreat && !selectedTemplateKey
  );

  if (isStepRetreatSelection) {
    return (
      <Box sx={{ height: '100%' }}>
        <RetreatsTablePage>
          <RetreatsCardTable>
            {(retreat) => (
              <ReportRetreatCard
                retreat={retreat}
                onSelect={handleSelectRetreat}
              />
            )}
          </RetreatsCardTable>
        </RetreatsTablePage>
      </Box>
    );
  }

  if (isStepTemplateSelection) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box>
            <Typography variant="h5">Galeria de Relatórios</Typography>
            <Typography variant="body2" color="text.secondary">
              Retiro selecionado: {selectedRetreat?.name}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={handleBackToRetreats}>
            Trocar retiro
          </Button>
        </Stack>

        {templatesQuery.isLoading && <LinearProgress />}
        {templatesQuery.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Erro ao carregar templates do retiro.
          </Alert>
        )}

        <Tabs
          value={selectedCategory}
          onChange={(_, value) => setSelectedCategory(value)}
          sx={{ my: 2 }}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {categories.map((category) => (
            <Tab
              key={category}
              value={category}
              label={category === 'all' ? 'Todos' : category}
            />
          ))}
        </Tabs>

        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid key={template.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Chip
                      label={template.category || 'Sem categoria'}
                      size="small"
                    />
                    <Chip
                      color={template.hasData ? 'success' : 'default'}
                      size="small"
                      label={
                        template.hasData ? 'Dados disponíveis' : 'Sem dados'
                      }
                    />
                  </Stack>
                  <Typography variant="h6">{template.title}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {template.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    mt={1}
                    display="block"
                  >
                    Registros estimados: {template.estimatedRecords}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!template.hasData}
                    onClick={() => handleSelectTemplate(template.key)}
                  >
                    Abrir visualizador
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        justifyContent="space-between"
        mb={2}
      >
        <Box>
          <Typography variant="h5">
            {reportQuery.data?.report.title || 'Visualizador'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {reportQuery.data?.report.retreatName || selectedRetreat?.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleBackToTemplates}>
            Voltar para templates
          </Button>
          {!useSpecializedViewer && (
            <>
              <Button
                variant="outlined"
                onClick={handleOpenPreview}
                disabled={previewLoading}
              >
                {previewLoading ? 'Gerando preview...' : 'Visualizar impressão'}
              </Button>
              <Button
                variant="contained"
                onClick={(event) => setExportAnchorEl(event.currentTarget)}
              >
                Exportar
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {useSpecializedViewer ? (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {selectedTemplateKey && selectedRetreat
            ? renderSpecializedReport(selectedTemplateKey, selectedRetreat.id)
            : null}
        </Box>
      ) : (
        <>
          {reportQuery.isLoading && <LinearProgress />}
          {reportQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro ao gerar relatório.
            </Alert>
          )}

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <TanStackTable<Record<string, unknown>, never>
              data={reportQuery.data?.data ?? []}
              columns={tableColumns as any}
              loading={reportQuery.isLoading}
              enablePagination
              manualPagination
              totalItems={reportQuery.data?.total ?? 0}
              pageSize={viewerPageSize}
              pageCount={Math.max(
                1,
                Math.ceil((reportQuery.data?.total ?? 0) / viewerPageSize)
              )}
              pageSizeOptions={[10, 25, 50, 100]}
              maxHeight="calc(100vh - 320px)"
              stickyHeader
              onPaginationModelChange={(model) => {
                setViewerPage(model.page + 1);
                setViewerPageSize(model.pageSize);
              }}
            />
          </Box>

          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={() => handleExport('pdf')}>PDF</MenuItem>
            <MenuItem onClick={() => handleExport('xlsx')}>XLSX</MenuItem>
            <MenuItem onClick={() => handleExport('csv')}>CSV</MenuItem>
          </Menu>

          <Dialog
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>Preview do Relatório (PDF)</DialogTitle>
            <DialogContent sx={{ p: 0, height: '80vh' }}>
              {previewUrl ? (
                <Box
                  component="iframe"
                  src={previewUrl}
                  sx={{ width: '100%', height: '100%', border: 0 }}
                />
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography>Nenhum preview disponível.</Typography>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ReportPage2;
