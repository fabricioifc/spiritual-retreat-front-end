'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

import { Box, Button } from '@mui/material';

import { TanStackTable } from '@/src/components/table';
import type { ExportHandler } from '@/src/components/table/exportHandlers';
import { useUrlFilters } from '@/src/hooks/useUrlFilters';
import apiClient from '@/src/lib/axiosClientInstance';

import { ReportsAllFilters } from '../../types';
import {
  ColumnDescriptor,
  buildTanStackReportColumns,
} from '../tanStackColumnsBuilder';
import { fetchGenericReport } from './shared';

interface ReportRow extends Record<string, unknown> {
  id: string | number;
}

/**
 * Factory para criar handlers de export com reportId
 */
function createExportHandlers(reportId: string) {
  const customCSVExport: ExportHandler<ReportRow> = async (
    filename?: string
  ) => {
    const finalFilename = filename ?? 'report.csv';

    try {
      const response = await apiClient.get(`/reports/${reportId}/export`, {
        params: { format: 'csv', fileName: finalFilename },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  };

  const customPDFExport: ExportHandler<ReportRow> = async (
    filename?: string
  ) => {
    const finalFilename = filename ?? 'report.pdf';

    try {
      const response = await apiClient.get(`/reports/${reportId}/export`, {
        params: { format: 'pdf', fileName: finalFilename },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  };

  return {
    csv: (id: string, filename?: string) => customCSVExport(reportId, filename),
    pdf: (id: string, filename?: string) => customPDFExport(reportId, filename),
  };
}

const GenericReportTable = ({ reportId }: { reportId: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await queryClient.invalidateQueries({
      queryKey: ['reports', reportId],
    });
    setLoading(false);
  };

  const { filters, updateFilters } = useUrlFilters<
    TableDefaultFilters<ReportsAllFilters>
  >({
    defaultFilters: {
      page: 1,
      pageLimit: 10,
    },
    excludeFromCount: ['page', 'pageLimit', 'search'],
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', reportId, filters],
    queryFn: () => fetchGenericReport(reportId, filters),
    staleTime: 5 * 60 * 1000,
  });

  const dynamicColumns = useMemo(() => {
    const fromApi = reportData?.columns;
    // if (fromApi && fromApi.length) {
    //   return buildTanStackReportColumns({ descriptors: fromApi });
    // }
    if (fromApi && Array.isArray(fromApi)) {
      // Transformar { key, label } em ColumnDef válido
      return fromApi.map((col: { key: string; label: string }) => ({
        id: col.key,
        accessorKey: col.key,
        header: col.label,
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const value = getValue();
          return value !== null && value !== undefined ? String(value) : '';
        },
      })) as ColumnDef<ReportRow>[];
    }
    const fallback: ColumnDescriptor[] = [
      { field: 'id', type: 'string', width: 80 },
      { field: 'name', type: 'string', minWidth: 180, flex: 1 },
      { field: 'sections', type: 'string', minWidth: 220, flex: 1 },
      { field: 'dateCreation', type: 'date', width: 160 },
      { field: 'registrationDate', type: 'date', width: 160 },
      { field: 'retreatName', type: 'string', minWidth: 160, flex: 1 },
    ];
    return buildTanStackReportColumns({ descriptors: fallback });
  }, [reportData?.columns]);

  const reportsArray: ReportRow[] = Array.isArray(reportData?.data)
    ? (reportData?.data as ReportRow[])
    : reportData?.data
      ? ([reportData?.data] as ReportRow[])
      : [];

  const handleViewReport = (report: ReportRow) => {
    router.push(`/reports/${report.id}`);
  };

  // Cria os handlers de export com o reportId capturado
  const exportHandlers = useMemo(
    () => createExportHandlers(reportId),
    [reportId]
  );

  const exportConfig = {
    extensions: ['csv', 'pdf'] as ('csv' | 'pdf')[],
    handlers: exportHandlers,
  };
  return (
    <Box
      sx={{
        p: 2,
        height: '100%',
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
      </Box>

      <Box sx={{ flexGrow: 1, height: 'calc(100% - 40px)' }}>
        <TanStackTable<ReportRow, 'csv' | 'pdf'>
          data={reportsArray}
          columns={dynamicColumns as ColumnDef<ReportRow>[]}
          loading={isLoading || loading}
          enablePagination
          manualPagination
          totalItems={reportData?.total || 0}
          pageSize={filters.pageLimit || 50}
          pageCount={
            reportData?.total
              ? Math.ceil(reportData.total / (filters.pageLimit || 50))
              : 0
          }
          pageSizeOptions={[10, 50, 100]}
          enableRowSelection
          enableGlobalFilter
          enableColumnFilters
          enableSorting
          enableColumnVisibility
          onRowDoubleClick={handleViewReport}
          exportConfig={exportConfig}
          maxHeight="calc(100% - 124px)"
          stickyHeader
          onPaginationModelChange={(newModel) => {
            updateFilters({
              ...filters,
              page: newModel.page + 1,
              pageLimit: newModel.pageSize,
            });
          }}
        />
      </Box>
    </Box>
  );
};

export default GenericReportTable;
