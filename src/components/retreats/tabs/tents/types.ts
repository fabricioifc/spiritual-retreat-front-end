import { RetreatsCardTableFilters } from "../../types";

export type UniqueIdentifier = string | number;

export interface RetreatTentsTableProps {
  columns?: number;
  containerStyle?: React.CSSProperties;
  getItemStyles?(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay: boolean;
  }): React.CSSProperties;
  wrapperStyle?(args: { index: number }): React.CSSProperties;
  itemCount?: number;
  items?: RetreatTentRoster[];
  handle?: boolean;
  renderItem?: unknown;
  minimal?: boolean;
  trashable?: boolean;
  scrollable?: boolean;
  onFiltersChange: (
    filters: TableDefaultFilters<RetreatsCardTableFilters>
  ) => void;
  filters: TableDefaultFilters<RetreatsCardTableFilters>;
  onEdit: (tentId: UniqueIdentifier) => void;
  onView: (tentId: UniqueIdentifier) => void;
  onDelete: (tentId: UniqueIdentifier) => void;
  total: number;
  setTentsReorderFlag: (flag: boolean) => void;
  onSaveReorder?: (items: Items) => Promise<void>;
  retreatId: string;
  canEditTent: boolean;
  isEditMode: boolean;
}

export type Items = Record<string, UniqueIdentifier[]>;

export interface MembersMapEntry {
  id: UniqueIdentifier;
  name: string;
  gender?: string;
  city?: string;
  //realFamilyId?: string;
}

export type MembersById = Record<UniqueIdentifier, MembersMapEntry>;
export type MemberToContainer = Record<UniqueIdentifier, UniqueIdentifier>;

export type RetreatTentLite = {
  tentId: UniqueIdentifier;
  number: string; // string in source JSON, keep as string for display-friendly IDs
  category: number;
  capacity: number;
  isActive: boolean;
  isLocked: boolean;
  notes?: string | null;
  assignedCount: number;
};
