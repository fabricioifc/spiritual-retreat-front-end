'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useSnackbar } from 'notistack';

import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';

import { TanStackTable } from '@/src/components/table/TanStackTable';
import { useModal } from '@/src/hooks/useModal';
import { getApiUrl } from '@/src/lib/apiConfig';
import apiClient from '@/src/lib/axiosClientInstance';

import Iconify from '../Iconify';
import OutboxDetailView from './OutboxDetail';
import OutboxSummaryCards from './OutboxSummaryCards';
import { OutboxListResponse, OutboxMessage, OutboxSummary } from './types';

type TableFilters = {
  page: number;
  pageLimit: number;
  processed: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
};

const defaultFilters: TableFilters = {
  page: 1,
  pageLimit: 10,
  processed: '',
  status: '',
  type: '',
  startDate: '',
  endDate: '',
};

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Processando' },
  { value: 'processed', label: 'Processada' },
  { value: 'failed', label: 'Falhou' },
];

const processedOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Processado' },
  { value: 'false', label: 'Não processado' },
];

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const statusColorMap: Record<OutboxMessage['status'], ButtonProps['color']> = {
  pending: 'warning',
  processing: 'info',
  processed: 'success',
  failed: 'error',
  queued: 'info',
  unknown: 'inherit',
};

export default function RetreatOutboxTab() {
  const t = useTranslations('retreat-outbox');
  const translate = useCallback(
    (key: string, defaultMessage: string) => t(key, { defaultMessage }),
    [t]
  );
  const modal = useModal();
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState<TableFilters>(defaultFilters);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['admin-outbox-summary'],
    queryFn: async () => {
      const response = await apiClient.get<OutboxSummary>(
        '/admin/outbox/summary',
        { baseURL: getApiUrl('admin') }
      );
      return response.data;
    },
  });

  const {
    data: tableData,
    isLoading: isTableLoading,
    refetch: refetchTable,
  } = useQuery({
    queryKey: ['admin-outbox', filters],
    queryFn: async () => {
      try {
        const params: Record<string, string | number | boolean> = {
          take: filters.pageLimit,
          skip: (filters.page - 1) * filters.pageLimit,
        };

        if (filters.processed) {
          params.processed = filters.processed === 'true';
        }

        if (filters.status) {
          params.status = filters.status;
        }

        if (filters.type) {
          params.type = filters.type;
        }

        if (filters.startDate) {
          params.startDate = filters.startDate;
        }

        if (filters.endDate) {
          params.endDate = filters.endDate;
        }

        const response = await apiClient.get<
          OutboxListResponse | OutboxMessage[]
        >('/admin/outbox', { params, baseURL: getApiUrl('admin') });
        const data = response.data;

        if (Array.isArray(data)) {
          return {
            items: data,
            totalCount: data.length,
            skip: (filters.page - 1) * filters.pageLimit,
            take: filters.pageLimit,
            hasNextPage: false,
            hasPreviousPage: filters.page > 1,
          } satisfies OutboxListResponse;
        }

        if (data && Array.isArray(data.items)) {
          return {
            items: data.items,
            totalCount: data.totalCount ?? 0,
            skip: data.skip ?? 0,
            take: data.take ?? filters.pageLimit,
            hasNextPage: data.hasNextPage ?? false,
            hasPreviousPage: data.hasPreviousPage ?? false,
          } satisfies OutboxListResponse;
        }

        return {
          items: [],
          totalCount: 0,
          skip: 0,
          take: filters.pageLimit,
          hasNextPage: false,
          hasPreviousPage: false,
        } satisfies OutboxListResponse;
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? ((error.response?.data as { error?: string })?.error ??
            error.message)
          : translate('fetch-error', 'Não foi possível carregar o outbox.');
        enqueueSnackbar(message, {
          variant: 'error',
          autoHideDuration: 4000,
        });
        throw error;
      }
    },
  });

  const rows = useMemo(() => {
    if (!tableData?.items) return [];

    return tableData.items.map((item) => {
      const derivedStatus = item.status
        ? item.status
        : ((item.processedAt
            ? 'processed'
            : item.attempts > 0
              ? 'processing'
              : 'pending') as OutboxMessage['status']);

      const processedValue =
        typeof item.processed === 'boolean'
          ? item.processed
          : Boolean(item.processedAt);

      return {
        ...item,
        status: derivedStatus,
        processed: processedValue,
      } satisfies OutboxMessage;
    });
  }, [tableData]);

  const handleFilterChange = useCallback(
    (key: keyof TableFilters, value: string) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? Number(value) : 1,
      }));
    },
    []
  );

  const openDetail = useCallback(
    (record: OutboxMessage) => {
      modal.open({
        title: t('detail-modal-title', {
          id: record.id,
          defaultMessage: `Mensagem ${record.id}`,
        }),
        size: 'lg',
        customRender: () => (
          <OutboxDetailView
            outboxId={record.id}
            onClose={() => modal.close?.()}
            onSuccess={() => {
              void Promise.all([refetchSummary(), refetchTable()]);
            }}
          />
        ),
      });
    },
    [modal, refetchSummary, refetchTable, t]
  );

  const columns = useMemo<ColumnDef<OutboxMessage>[]>(
    () => [
      {
        accessorKey: 'id',
        header: translate('columns.id', 'ID'),
        size: 180,
      },
      {
        accessorKey: 'type',
        header: translate('columns.type', 'Tipo'),
        size: 160,
      },
      {
        accessorKey: 'status',
        header: translate('columns.status', 'Status'),
        size: 130,
        cell: ({ getValue }) => {
          const status = (getValue() as OutboxMessage['status']) ?? 'unknown';
          const buttonColor: ButtonProps['color'] =
            statusColorMap[status] ?? 'inherit';
          return (
            <Button
              variant="outlined"
              color={buttonColor}
              size="small"
              sx={{ pointerEvents: 'none' }}
            >
              {status}
            </Button>
          );
        },
      },
      {
        accessorKey: 'attempts',
        header: translate('columns.attempts', 'Tentativas'),
        size: 120,
        cell: ({ getValue }) => String(getValue() ?? 0),
      },
      {
        accessorKey: 'createdAt',
        header: translate('columns.createdAt', 'Criada em'),
        size: 180,
        cell: ({ getValue }) => formatDateTime(getValue() as string),
      },
      {
        accessorKey: 'processedAt',
        header: translate('columns.processedAt', 'Processada em'),
        size: 180,
        cell: ({ getValue }) => formatDateTime(getValue() as string),
      },
      {
        id: 'actions',
        header: translate('columns.actions', 'Ações'),
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <Tooltip title={translate('table.actions.view', 'Ver detalhes')}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => openDetail(row.original)}
            >
              <Iconify icon="lucide:scan-text" width={20} />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [translate, openDetail]
  );

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <Box
      sx={{
        p: 2,
        height: '100%',
        minHeight: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <OutboxSummaryCards summary={summary} isLoading={isSummaryLoading} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <TextField
          select
          label={translate('filters.status', 'Status')}
          value={filters.status}
          onChange={(event) => handleFilterChange('status', event.target.value)}
          sx={{ minWidth: 180 }}
        >
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={translate('filters.processed', 'Processado')}
          value={filters.processed}
          onChange={(event) =>
            handleFilterChange('processed', event.target.value)
          }
          sx={{ minWidth: 180 }}
        >
          {processedOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* <TextField
          label={translate('filters.type', 'Tipo')}
          value={filters.type}
          onChange={(event) => handleFilterChange('type', event.target.value)}
          sx={{ minWidth: 200 }}
          placeholder={translate('filters.type-placeholder', 'Ex: email, sms')}
        />

        <TextField
          label={translate('filters.startDate', 'Data inicial')}
          type="date"
          value={filters.startDate}
          onChange={(event) =>
            handleFilterChange('startDate', event.target.value)
          }
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label={translate('filters.endDate', 'Data final')}
          type="date"
          value={filters.endDate}
          onChange={(event) =>
            handleFilterChange('endDate', event.target.value)
          }
          InputLabelProps={{ shrink: true }}
        /> */}

        <Button variant="text" color="inherit" onClick={handleResetFilters}>
          {translate('filters.reset', 'Limpar filtros')}
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 1000,
        }}
      >
        <TanStackTable<OutboxMessage & Record<string, unknown>>
          data={rows as (OutboxMessage & Record<string, unknown>)[]}
          columns={
            columns as ColumnDef<OutboxMessage & Record<string, unknown>>[]
          }
          loading={isTableLoading}
          title={translate('table.title', 'Mensagens na fila')}
          subtitle={translate(
            'table.subtitle',
            'Acompanhe o processamento de notificações.'
          )}
          enablePagination
          manualPagination
          pageCount={Math.ceil((tableData?.totalCount ?? 0) / filters.pageLimit)}
          pageSize={filters.pageLimit}
          pageSizeOptions={[10, 25, 50, 100, 999]}
          onPaginationModelChange={(model) => {
            setFilters((prev) => {
              const nextPage = model.page + 1;
              const nextPageLimit = model.pageSize;

              if (prev.page === nextPage && prev.pageLimit === nextPageLimit) {
                return prev;
              }

              return {
                ...prev,
                page: nextPage,
                pageLimit: nextPageLimit,
              };
            });
          }}
          enableRowSelection={false}
          enableGlobalFilter={false}
          enableColumnFilters={false}
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
}
