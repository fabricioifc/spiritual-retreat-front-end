import { RetreatsCardTableFilters } from "../../types";

export type UniqueIdentifier = string | number;

export interface RetreatFamilyRequest {
  families: RetreatFamily[];
  version: number;
  familiesLocked: boolean;
}

export interface FamiliesModalAction {
  type:
    | "create"
    | "message"
    | "addParticipant"
    | "configure"
    | "draw"
    | "lock"
    | "reset";
  familyId?: string;
}

export interface RetreatFamiliesProps {
  adjustScale?: boolean;
  cancelDrop?: unknown;
  columns?: number;
  containerStyle?: React.CSSProperties;
  coordinateGetter?: unknown;
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
  items?: RetreatFamily[];
  handle?: boolean;
  renderItem?: unknown;
  strategy?: unknown;
  modifiers?: unknown;
  minimal?: boolean;
  trashable?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
  onFiltersChange: (
    filters: TableDefaultFilters<RetreatsCardTableFilters>
  ) => void;
  filters: TableDefaultFilters<RetreatsCardTableFilters>;
  onEdit: (familyId: UniqueIdentifier) => void;
  onView: (familyId: UniqueIdentifier) => void;
  onDelete?: (familyId: UniqueIdentifier) => void;
  total: number;
  setFamiliesReorderFlag: (flag: boolean) => void;
  onSaveReorder?: (items: Items) => Promise<void>;
  retreatId: string;
  canEditFamily: boolean;
  isEditMode: boolean;
  loading: boolean;
}

export type Items = Record<string, UniqueIdentifier[]>;

export interface MembersMapEntry {
  registrationId: UniqueIdentifier;
  name: string;
  gender: string;
  city: string;
  position: number;
}

export type MembersById = Record<UniqueIdentifier, MembersMapEntry>;
export type MemberToContainer = Record<UniqueIdentifier, UniqueIdentifier>;
