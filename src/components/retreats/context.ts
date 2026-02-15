'use client';
import { createContext, useContext } from 'react';

import { RetreatSimple, RetreatsCardTableFilters } from './types';

export interface RetreatsTableContextValue {
  loading: boolean;
  total: number;
  data: RetreatSimple[];
  filters: TableDefaultFilters<RetreatsCardTableFilters>;
  onEdit: (retreatId: string) => void;
  onView: (retreatId: string) => void;
  onFiltersChange: (
    filters: TableDefaultFilters<RetreatsCardTableFilters>
  ) => void;
}

export const RetreatsTableContext = createContext<RetreatsTableContextValue | null>(
  null
);

export const useRetreatsTableContext = () => {
  const context = useContext(RetreatsTableContext);

  if (!context) {
    throw new Error(
      'useRetreatsTableContext must be used inside RetreatsTableProvider'
    );
  }

  return context;
};
