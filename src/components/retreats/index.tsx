'use client';
import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { Button, Container, Typography } from '@mui/material';
import { Box, Stack } from '@mui/material';

//import { Retreat } from "@/src/types/retreats";
import { useModal } from '@/src/hooks/useModal';
import { useUrlFilters } from '@/src/hooks/useUrlFilters';
import apiClient from '@/src/lib/axiosClientInstance';
import getPermission from '@/src/utils/getPermission';

import { keysToRemoveFromFilters } from '../table/shared';
import RetreatOverview from './CardTable/RetreatOverview';
import RetreatsCardTable from './CardTable/RetreatsCardTable';
import {
  RetreatSimple,
  RetreatSimpleRequest,
  RetreatsCardTableDateFilters,
  RetreatsCardTableFilters,
} from './types';

const getRetreats = async (
  filters: TableDefaultFilters<
    RetreatsCardTableFilters & RetreatsCardTableDateFilters
  >
) => {
  try {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageLimit =
      filters.pageLimit && filters.pageLimit > 0 ? filters.pageLimit : 20;
    const skip = (page - 1) * pageLimit;
    const filtersFiltered = keysToRemoveFromFilters.forEach(
      (key) => delete filters[key]
    );
    const params: Record<string, unknown> = {
      // status: 1,
      skip,
      take: pageLimit,
      filtersFiltered,
    };
    const response = await apiClient.get<RetreatSimpleRequest>('/Retreats', {
      params,
    });

    return response.data;
  } catch (err) {
    console.error('getRetreats: ', err);
    throw err;
  }
};

export default function RetreatsTablePage() {
  const t = useTranslations();
  const router = useRouter();
  const modal = useModal();
  const { filters, updateFilters } = useUrlFilters<
    TableDefaultFilters<RetreatsCardTableFilters>
  >({
    defaultFilters: {
      page: 1,
      pageLimit: 4,
    },
    excludeFromCount: ['page', 'pageLimit'], // Don't count pagination in active filters
  });

  const { data: sessionData } = useSession();
  const [hasCreatePermission, setHasCreatePermission] = useState(false);

  useEffect(() => {
    if (sessionData && sessionData.user) {
      setHasCreatePermission(
        getPermission({
          permissions: sessionData.user.permissions,
          permission: 'users.create',
          role: sessionData.user.role,
        })
      );
    }
  }, [sessionData]);

  const {
    data: retreatsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['retreats', filters],
    queryFn: () => getRetreats(filters),
    staleTime: 5 * 60 * 1000,
  });

  const handleEdit = (retreatId: string) => {
    router.push(`/retreats/${retreatId}`);
  };

  const handleView = (retreatId: string) => {
    modal.open({
      title: t('overview'),
      size: 'lg',
      customRender() {
        return <RetreatOverview retreatId={retreatId} />;
      },
    });
  };

  const handleFiltersChange = (
    newFilters: TableDefaultFilters<RetreatsCardTableFilters>
  ) => {
    updateFilters({ ...filters, ...newFilters });
  };

  const retreatsDataArray: RetreatSimple[] = Array.isArray(retreatsData?.items)
    ? retreatsData?.items
    : ([retreatsData?.items] as unknown as RetreatSimple[]);

  if (isError) return <Typography>No data available.</Typography>;

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Typography variant="h5">{t('retreats')}</Typography>
        {/* <FilterButton<
          TableDefaultFilters<RetreatsCardTableFilters>,
          RetreatsCardTableDateFilters
        >
          filters={filtersConfig}
          defaultValues={filters}
          onApplyFilters={handleApplyFilters}
          onReset={resetFilters}
          activeFiltersCount={activeFiltersCount}
        /> */}
        {hasCreatePermission && (
          <Button variant="contained">
            <Link href={{ pathname: '/retreats/create' }}>
              Criar Novo Retiro
            </Link>
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
        }}
      >
        <RetreatsCardTable
          loading={isLoading}
          total={retreatsData?.totalCount || 0}
          filters={filters}
          data={retreatsDataArray}
          onEdit={handleEdit}
          onView={handleView}
          onFiltersChange={handleFiltersChange}
        />
      </Box>
    </Container>
  );
}
