'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns/format';

import { Box, Button } from '@mui/material';
import { GridRowSelectionModel } from '@mui/x-data-grid/models';

import { useModal } from '@/src/hooks/useModal';
import { useUrlFilters } from '@/src/hooks/useUrlFilters';
import apiClient from '@/src/lib/axiosClientInstance';
import getPermission from '@/src/utils/getPermission';

import FilterButton from '../filters/FilterButton';
import SearchField from '../filters/SearchField';
import DataTable, { DataTableColumn } from '../table/DataTable';
import DeleteReport from './DeleteReport';
import EditReport from './EditReport';
import { ReportsAllFilters, ReportsTableFilters } from './types';
import { useReportsFilters } from './useFilters';

type ReportGeneral = {
  id: string;
  title: string;
  dateCreation: string;
  templateKey?: string;
  category?: string;
  defaultParamsJson?: string;
};

const normalizeReportType = (value?: string) =>
  (value ?? '').toString().trim().toLowerCase();

const resolveReportRoute = (report: ReportGeneral) => {
  const type = normalizeReportType(report.category || report.templateKey);

  const isLogisticType = [
    'logistic',
    'tents',
    'tentsallocation',
    'ribbons',
    'service-team',
    'serviceteam',
    'exitchecklist',
    'botafora',
    'bota-fora',
  ].includes(type);

  return isLogisticType ? 'logistic' : 'all';
};

type ReportDataRequest = {
  data: ReportGeneral[];
  total: number;
  page: number;
  pageLimit: number;
};

const columns: DataTableColumn<ReportGeneral>[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 70,
    type: 'string',
  },
  {
    field: 'title',
    headerName: 'Nome',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => (
      <Box
        component="span"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 160,
        }}
      >
        {params.value}
      </Box>
    ),
  },
  {
    field: 'dateCreation',
    headerName: 'Data de Criação',
    width: 140,
    valueFormatter: (v) => (v ? format(new Date(v), 'dd/MM/yyyy - HH:mm') : ''),
  },
];

const fetchReports = async (
  filters: TableDefaultFilters<ReportsAllFilters>
) => {
  try {
    const response = await apiClient.get<ReportDataRequest>('/reports', {
      params: filters,
    });
    return response.data as ReportDataRequest;
  } catch (e) {
    console.error(e);
  }
};

const deleteReport = async (id: string | number) => {
  const response = await apiClient.delete(`/reports/${id}`);

  if (!response) {
    throw new Error('Failed to delete report');
  }

  return response;
};

const ReportPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const modal = useModal();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<
    GridRowSelectionModel | undefined
  >(undefined);
  const { filters: filtersConfig } = useReportsFilters();

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const { filters, updateFilters, activeFiltersCount, resetFilters } =
    useUrlFilters<TableDefaultFilters<ReportsAllFilters>>({
      defaultFilters: {
        page: 1,
        pageLimit: 10,
      },
      excludeFromCount: ['page', 'pageLimit', 'search'], // Don't count pagination in active filters
    });
  const handleApplyFilters = (
    newFilters: Partial<TableDefaultFilters<ReportsAllFilters>>
  ) => {
    updateFilters({ ...filters, ...newFilters });
  };

  // Fetch reports data
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => fetchReports(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: sessionData } = useSession();
  const [hasDeletePermission, setHasDeletePermission] = useState(false);

  useEffect(() => {
    if (sessionData && sessionData.user) {
      setHasDeletePermission(
        getPermission({
          permissions: sessionData.user.permissions,
          permission: 'reports.delete',
          role: sessionData.user.role,
        })
      );
    }
  }, [sessionData]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const onConfirmDelete = (reportId: string | number) => {
    return deleteMutation.mutate(reportId);
  };

  // Handlers for the DataGrid actions
  const handleViewReport = (report: any) => {
    const route = resolveReportRoute(report as ReportGeneral);
    router.push(`/reports/${report.id}/${route}`);
  };

  const handleDeleteReport = (
    report: any,
    onConfirmDelete: (reportId: number | string) => void
  ) => {
    modal.open({
      title: 'Deletar Relatório',
      size: 'sm',
      customRender: () => (
        <DeleteReport
          report={report}
          onConfirmDelete={onConfirmDelete}
          onClose={() => modal.close()}
          isLoading={deleteMutation.isPending}
        />
      ),
    });
  };

  const handleEditReport = (report: ReportGeneral) => {
    modal.open({
      title: 'Editar Relatório',
      size: 'sm',
      customRender: () => (
        <EditReport
          report={report}
          onClose={() => modal.close()}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
          }}
        />
      ),
    });
  };

  const handleCreateReport = () => {
    router.push('/reports/new');
  };

  const reportsArray: ReportGeneral[] = Array.isArray(reportsData?.data)
    ? (reportsData!.data as ReportGeneral[])
    : reportsData?.data
      ? ([reportsData.data] as ReportGeneral[])
      : [];

  return (
    <Box
      sx={{
        p: 2,
        minHeight: '100%',
        minWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        overflowY: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 2 },
          mb: 2,
        }}
      >
        <Box
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 4px)', md: 'initial' },
            minWidth: 0,
          }}
        >
          <Button
            variant="contained"
            onClick={handleRefresh}
            disabled={loading}
            fullWidth
            sx={{ height: 40, maxWidth: { md: 150 } }}
          >
            {loading ? 'Carregando...' : 'Atualizar Dados'}
          </Button>
        </Box>

        <Box
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 4px)', md: '1 1 auto' },
            minWidth: { xs: 0, md: 150 },
            maxWidth: { md: 150 },
          }}
        >
          <FilterButton<TableDefaultFilters<ReportsTableFilters>>
            filters={filtersConfig}
            defaultValues={filters}
            onApplyFilters={handleApplyFilters}
            onReset={resetFilters}
            activeFiltersCount={activeFiltersCount}
            fullWidth
          />
        </Box>

        <Box
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 4px)', md: 'initial' },
            minWidth: 0,
          }}
        >
          <SearchField
            sx={{ maxWidth: { md: 250 } }}
            fullWidth
            multiline
            value={filters.search || ''}
            onChange={(e) => {
              updateFilters({ ...filters, search: e });
            }}
            placeholder="search-field"
          />
        </Box>

        <Box
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 4px)', md: '1 1 auto' },
            minWidth: 0,
            maxWidth: { md: 150 },
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            onClick={handleCreateReport}
            fullWidth
            sx={{ height: 40 }}
          >
            {t('new-report')}
          </Button>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, maxHeight: '900px' }}>
        <DataTable<ReportGeneral, ReportsAllFilters>
          disableVirtualization={true}
          rows={reportsArray}
          rowCount={reportsData?.total || 0}
          columns={columns}
          loading={isLoading || loading}
          // Configurações de aparência
          title="Gerenciamento de Relatórios"
          subtitle="Lista completa de relatórios do sistema"
          autoWidth={true}
          autoHeight={true}
          // Paginação
          width={1200}
          height={600}
          pagination={true}
          showToolbar={false}
          paginationMode="server"
          page={filters.page ? filters.page - 1 : 0}
          pageSize={filters.pageLimit || 10}
          pageSizeOptions={[10, 25, 50, 100]}
          onPaginationModelChange={(newModel) => {
            updateFilters({
              ...filters,
              page: newModel.page + 1,
              pageLimit: newModel.pageSize,
            });
          }}
          serverFilters={filters}
          // Seleção
          checkboxSelection={true}
          rowSelectionModel={selectedRows}
          onRowSelectionModelChange={setSelectedRows}
          // Ações personalizadas
          actions={[
            {
              icon: 'lucide:eye',
              label: 'Acessar relatório',
              onClick: (report) => handleViewReport(report),
              color: 'info',
            },
            {
              icon: 'lucide:pencil',
              label: 'Editar relatório',
              onClick: (report) => handleEditReport(report),
              color: 'primary',
            },
            {
              icon: 'lucide:trash-2',
              label: 'Deletar relatório',
              onClick: (report) => handleDeleteReport(report, onConfirmDelete),
              color: 'error',
              disabled: () => !hasDeletePermission,
            },
          ]}
        />
      </Box>
    </Box>
  );
};

export default ReportPage;
