"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import RetreatFamiliesTable from "../RetreatFamiliesTable";
import { Items, UniqueIdentifier } from "../types";
import { RetreatsCardTableFilters } from "@/src/components/public/retreats/types";

interface FamiliesContentProps {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  familiesDataArray: RetreatFamily[];
  total: number;
  filters: TableDefaultFilters<RetreatsCardTableFilters>;
  canEditFamily: boolean;
  isEditMode: boolean;
  retreatId: string;
  onSaveReorder: (items: Items) => Promise<void>;
  onSetReordering: (value: boolean) => void;
  onEdit: (familyId: UniqueIdentifier) => void;
  onView: (familyId: UniqueIdentifier) => void;
  onDelete: (familyId: UniqueIdentifier) => void;
  onFiltersChange: (
    filters: TableDefaultFilters<RetreatsCardTableFilters>
  ) => void;
}

export default function FamiliesContent({
  isLoading,
  isError,
  isFetching,
  familiesDataArray,
  total,
  filters,
  canEditFamily,
  isEditMode,
  retreatId,
  onSaveReorder,
  onSetReordering,
  onEdit,
  onView,
  onDelete,
  onFiltersChange,
}: FamiliesContentProps) {
  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ height: "100%" }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (isError) {
    return <Typography color="error">Erro ao carregar famílias.</Typography>;
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <RetreatFamiliesTable
        loading={isFetching}
        setFamiliesReorderFlag={onSetReordering}
        onSaveReorder={onSaveReorder}
        total={total}
        filters={filters}
        items={familiesDataArray}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        onFiltersChange={onFiltersChange}
        retreatId={retreatId}
        canEditFamily={canEditFamily}
        isEditMode={isEditMode}
      />
    </Box>
  );
}
