'use client';

import React, { Suspense, useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { Box, Button, Chip } from '@mui/material';
import { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';

import { useModal } from '@/src/hooks/useModal';
import { useUrlFilters } from '@/src/hooks/useUrlFilters';
import apiClient from '@/src/lib/axiosClientInstance';
import getPermission from '@/src/utils/getPermission';

import DeleteConfirmation from '../../confirmations/DeleteConfirmation';
import SearchField from '../../filters/SearchField';
import Loading from '../../loading';
import { DataTable, DataTableColumn } from '../../table/DataTable';
import { pageToSkipTake } from '../../table/shared';
import { User } from '../types';
import UserSummaryModal from '../userSummaryModal';

type UserRequest = {
  items: User[];
  totalCount: number;
  skip: number;
  take: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

// Dados de exemplo
const getUsers = async (
  filters: TableDefaultFilters<UsersTableFiltersWithDates>
) => {
  const { page, pageLimit, ...restFilters } = filters;
  const response = await apiClient.get<UserRequest>('/users', {
    params: {
      ...pageToSkipTake(Number(page), Number(pageLimit)),
      ...restFilters,
    },
  });

  if (!response) {
    throw new Error('Failed to fetch users');
  }
  return response.data as UserRequest;
};

// Definir as colunas da tabela
const columns: DataTableColumn<User>[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 70,
    type: 'string',
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 200,
    flex: 1,
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 250,
    flex: 1,
  },
  {
    field: 'role',
    headerName: 'Função',
    width: 120,
    type: 'singleSelect',
    valueOptions: ['Admin', 'Manager', 'User'],
  },
  {
    field: 'enabled',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value === true ? 'Ativo' : 'Inativo'}
        color={params.value === true ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: 'emailConfirmed',
    headerName: 'Email Confirmad',
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value === true ? 'Sim' : 'Não'}
        color={params.value === true ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
    ),
  },
];

export default function UserDataTable() {
  // const t = useTranslations();
  const { filters, updateFilters } = useUrlFilters<
    TableDefaultFilters<UsersTableFiltersWithDates>
  >({
    defaultFilters: {
      page: 1,
      pageLimit: 10,
    },
    excludeFromCount: ['page', 'pageLimit', 'search'], // Don't count pagination in active filters,
  });
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes,
  });

  const session = useSession();
  const [hasCreatePermission, setHasCreatePermission] = useState(false);

  useEffect(() => {
    if (session.data && session.data.user) {
      setHasCreatePermission(
        getPermission({
          permissions: session.data.user.permissions,
          permission: 'users.create',
          role: session.data.user.role,
        })
      );
    }
  }, [session.data]);

  // ✅ CORREÇÃO: Usar o tipo correto
  const [selectedRows, setSelectedRows] = useState<
    GridRowSelectionModel | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const modal = useModal();

  // ✅ Helper para obter IDs selecionados
  const getSelectedIds = (): GridRowId[] => {
    if (Array.isArray(selectedRows)) {
      return selectedRows;
    }
    if (typeof selectedRows === 'object' && 'ids' in selectedRows) {
      return Array.from(selectedRows.ids) || [];
    }
    return [];
  };

  const handleEdit = (user: User) => {
    router.push(`/users/${user.id}`);
  };

  const handleDelete = (user: User) => {
    modal.open({
      title: 'Confirm deletion',
      size: 'sm',
      customRender: () => (
        <DeleteConfirmation
          title="Delete user"
          resourceName={user.name}
          description="This action cannot be undone and will permanently remove the user."
          requireCheckboxLabel="I understand the consequences."
          onConfirm={async () => {
            try {
              await apiClient.delete(`/users/${user.id}`);
              if (typeof window !== 'undefined') {
                const { enqueueSnackbar } = await import('notistack');
                enqueueSnackbar('User deleted successfully', {
                  variant: 'success',
                });
              }
            } catch (err: unknown) {
              if (typeof window !== 'undefined') {
                const { enqueueSnackbar } = await import('notistack');
                const errorMessage =
                  err instanceof Error ? err.message : 'Failed to delete user';
                enqueueSnackbar(errorMessage, {
                  variant: 'error',
                });
              }
            }
          }}
        />
      ),
    });
  };

  const handleCreateNewUser = () => {
    router.push('/users/create');
  };

  const handleView = (user: User) => {
    modal.open({
      title: `Detalhes do Usuário: ${user.name}`,
      size: 'xl',
      customRender: () => (
        <Suspense fallback={<div>Carregando detalhes do usuário...</div>}>
          <UserSummaryModal userId={user.id.toString()} />
        </Suspense>
      ),
    });
  };

  const handleBulkAction = () => {
    // Handle bulk action
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const usersDataArray: User[] = Array.isArray(usersData?.items)
    ? usersData.items.filter(
        (user): user is User =>
          Boolean(user) && typeof user.id !== 'undefined' && user.id !== null
      )
    : [];

  if (isLoading || session.status === 'loading' || !session.data?.user) {
    return <Loading text="Carregando usuários..." />;
  }

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
        {hasCreatePermission && (
          <Box
            sx={{
              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 4px)',
                md: 'initial',
              },
              minWidth: { xs: 0, md: 200 },
            }}
          >
            <Button
              variant="contained"
              onClick={handleCreateNewUser}
              fullWidth
              sx={{ height: 40, maxWidth: { md: 200 } }}
            >
              {'Criar Novo Usuário'}
            </Button>
          </Box>
        )}

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
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 4px)', md: 'initial' },
            minWidth: 0,
          }}
        >
          <SearchField
            fullWidth
            value={filters.search || ''}
            onChange={(e) => {
              updateFilters({ ...filters, search: e });
            }}
            placeholder="search-field"
          />
        </Box>

        {getSelectedIds().length > 0 && (
          <Box
            sx={{
              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 4px)',
                md: 'initial',
              },
              minWidth: 0,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBulkAction}
              fullWidth
              sx={{ height: 40 }}
            >
              Ação em Lote ({getSelectedIds().length})
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, maxHeight: '90%' }}>
        <DataTable<User, UsersTableFiltersWithDates>
          rows={usersDataArray}
          rowCount={usersData?.totalCount || 0}
          getRowId={(row) => row.id}
          columns={columns}
          loading={isLoading || !session.data?.user || loading}
          disableVirtualization={true}
          // Configurações de aparência
          title="Gerenciamento de Usuários"
          subtitle="Lista completa de usuários do sistema"
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
          // Desabilita virtualização para listas pequenas (menos de 100 itens)
          // Ações personalizadas
          actions={[
            {
              icon: 'lucide:eye',
              label: 'Visualizar',
              onClick: handleView,
              color: 'info',
            },
            {
              icon: 'lucide:edit',
              label: 'Editar',
              onClick: handleEdit,
              color: 'primary',
            },
            {
              icon: 'lucide:trash-2',
              label: 'Deletar',
              onClick: handleDelete,
              color: 'error',
              disabled: (user) => user.role === 'Admin', // Admins não podem ser deletados
            },
          ]}
          // Eventos
          onRowClick={() => {
            // Row click handler
          }}
          onRowDoubleClick={(params) => {
            handleView(params.row);
          }}
        />
      </Box>
    </Box>
  );
}
