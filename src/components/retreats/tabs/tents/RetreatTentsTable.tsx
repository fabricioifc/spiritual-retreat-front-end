'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useTranslations } from 'next-intl';

import { PointerActivationConstraints } from '@dnd-kit/dom';
import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';

import {
  Box,
  Button,
  Fab,
  Fade,
  Grid,
  ListItemText,
  MenuItem,
  MenuList,
  Pagination,
  Popover,
  Stack,
  Typography,
} from '@mui/material';

import Iconify from '@/src/components/Iconify';
import {
  Container,
  ContainerProps,
  Item,
} from '@/src/components/dnd-kit/components';
import { LoadingScreen } from '@/src/components/loading-screen';

import ContainerButtons from './ContainerButtons';
import MoreMenu from './MoreMenu';
import { TRASH_ID, onDragEnd, onDragOver } from './shared';
import {
  Items,
  MemberToContainer,
  MembersById,
  RetreatTentsTableProps,
} from './types';

type UniqueIdentifier = string | number;

const DEFAULT_GET_ITEM_STYLES = () => ({});
const DEFAULT_WRAPPER_STYLE = () => ({});
const GRID_CARD_SIZE = { xs: 12, md: 6, lg: 4 } as const;

const sensors = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: 6 }),
    ],
  }),
  KeyboardSensor,
];

function cloneItems(source: Items): Items {
  return Object.fromEntries(
    Object.entries(source).map(([k, v]) => [k, [...v]])
  );
}

const genderColorMap: Record<string, string> = {
  Male: '#1976d2',
  Female: '#d81b60',
};

type DroppableTentContainerProps = ContainerProps & {
  disabled?: boolean;
  id: UniqueIdentifier;
  index: number;
  items: UniqueIdentifier[];
  style?: React.CSSProperties;
  isSourceContainer?: boolean;
  isTargetContainer?: boolean;
};

const DroppableTentContainer = React.memo(function DroppableTentContainer({
  children,
  columns = 1,
  disabled,
  id,
  index: containerIndex,
  items,
  style,
  color,
  isSourceContainer,
  isTargetContainer,
  ...props
}: DroppableTentContainerProps) {
  const { ref, isDragging, isDropTarget } = useSortable({
    id,
    index: containerIndex,
    data: {
      type: 'container',
      children: items,
    },
    disabled,
  });

  return (
    <Container
      ref={disabled ? undefined : ref}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : undefined,
      }}
      hover={Boolean(isTargetContainer || isSourceContainer) || isDropTarget}
      handleProps={{}}
      columns={columns}
      color={color}
      {...props}
    >
      {children}
    </Container>
  );
});

interface SortableTentItemProps {
  id: UniqueIdentifier;
  value: string;
  index: number;
  handle: boolean;
  disabled?: boolean;
  group: UniqueIdentifier;
  style(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay: boolean;
  }): React.CSSProperties;
  containerId: UniqueIdentifier;
  wrapperStyle({ index }: { index: number }): React.CSSProperties;
}

const SortableTentItem = React.memo(function SortableTentItem({
  disabled,
  id,
  index,
  handle,
  value,
  style,
  containerId,
  wrapperStyle,
  group,
}: SortableTentItemProps) {
  const { ref, handleRef, isDragging, isDragSource } = useSortable({
    id,
    index,
    group,
    disabled,
  });
  const computedStyle = style({
    index,
    value: id,
    isDragging,
    isSorting: isDragSource,
    overIndex: -1,
    containerId,
    isDragOverlay: false,
  });

  return (
    <Item
      ref={disabled ? undefined : ref}
      value={value}
      dragging={isDragging}
      sorting={isDragSource}
      handle={handle}
      handleProps={handle && !disabled ? { ref: handleRef } : undefined}
      index={index}
      wrapperStyle={wrapperStyle({ index })}
      style={computedStyle}
    />
  );
});

interface TentGridItemProps {
  containerId: UniqueIdentifier;
  containerIndex: number;
  memberIds: UniqueIdentifier[];
  tentMeta?: {
    number: string;
    category: string;
    capacity: number;
    color: string;
  };
  minimal: boolean;
  scrollable?: boolean;
  containerStyle?: React.CSSProperties;
  canEditTentInMode: boolean;
  isSortingContainer: boolean;
  handle: boolean;
  getItemStyles: NonNullable<RetreatTentsTableProps['getItemStyles']>;
  wrapperStyle: NonNullable<RetreatTentsTableProps['wrapperStyle']>;
  onEdit: (tentId: UniqueIdentifier) => void;
  onView: (tentId: UniqueIdentifier) => void;
  onDelete: (tentId: UniqueIdentifier) => void;
  canEditTent: boolean;
  membersById: MembersById;
  isSourceContainer: boolean;
  isTargetContainer: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const TentGridItem = React.memo(function TentGridItem({
  containerId,
  containerIndex,
  memberIds,
  tentMeta,
  minimal,
  scrollable,
  containerStyle,
  canEditTentInMode,
  isSortingContainer,
  handle,
  getItemStyles,
  wrapperStyle,
  onEdit,
  onView,
  onDelete,
  canEditTent,
  membersById,
  isSourceContainer,
  isTargetContainer,
  t,
}: TentGridItemProps) {
  const label = tentMeta
    ? t('card-label', { number: tentMeta.number })
    : t('card-label', { number: containerId });

  return (
    <Grid size={GRID_CARD_SIZE}>
      <DroppableTentContainer
        id={containerId}
        index={containerIndex}
        label={minimal ? undefined : label}
        color={tentMeta?.color}
        items={memberIds}
        scrollable={scrollable}
        style={containerStyle}
        unstyled={minimal}
        disabled={!canEditTentInMode}
        isSourceContainer={isSourceContainer}
        isTargetContainer={isTargetContainer}
      >
        {memberIds.map((memberId, index) => {
          const meta = membersById[memberId];
          return (
            <SortableTentItem
              disabled={!canEditTentInMode || isSortingContainer}
              key={memberId}
              id={memberId}
              value={meta?.name || String(memberId)}
              index={index}
              handle={handle}
              style={getItemStyles}
              wrapperStyle={wrapperStyle}
              containerId={containerId}
              group={containerId}
            />
          );
        })}
        <ContainerButtons
          onEdit={onEdit}
          onView={onView}
          onDelete={onDelete}
          tentId={containerId}
          canEdit={canEditTent}
          disableActions={!canEditTentInMode}
        />
        {tentMeta ? (
          <Stack spacing={0.5} mt={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {t('tent-info', {
                gender: t(`gender.${tentMeta.category}` as const),
                capacity: tentMeta.capacity,
                current: memberIds.length,
              })}
            </Typography>
          </Stack>
        ) : null}
      </DroppableTentContainer>
    </Grid>
  );
}, areTentGridItemPropsEqual);

function areTentGridItemPropsEqual(
  prev: TentGridItemProps,
  next: TentGridItemProps
) {
  return (
    prev.containerId === next.containerId &&
    prev.containerIndex === next.containerIndex &&
    prev.memberIds === next.memberIds &&
    prev.tentMeta === next.tentMeta &&
    prev.minimal === next.minimal &&
    prev.scrollable === next.scrollable &&
    prev.containerStyle === next.containerStyle &&
    prev.canEditTentInMode === next.canEditTentInMode &&
    prev.isSortingContainer === next.isSortingContainer &&
    prev.handle === next.handle &&
    prev.getItemStyles === next.getItemStyles &&
    prev.wrapperStyle === next.wrapperStyle &&
    prev.onEdit === next.onEdit &&
    prev.onView === next.onView &&
    prev.onDelete === next.onDelete &&
    prev.canEditTent === next.canEditTent &&
    prev.membersById === next.membersById &&
    prev.isSourceContainer === next.isSourceContainer &&
    prev.isTargetContainer === next.isTargetContainer &&
    prev.t === next.t
  );
}

export default function RetreatTentsTable({
  items: initialItems,
  handle = true,
  containerStyle,
  getItemStyles = DEFAULT_GET_ITEM_STYLES,
  wrapperStyle = DEFAULT_WRAPPER_STYLE,
  minimal = false,
  trashable = false,
  scrollable,
  onFiltersChange,
  filters,
  onView,
  onEdit,
  onDelete,
  total,
  setTentsReorderFlag,
  onSaveReorder,
  canEditTent,
  isEditMode,
}: RetreatTentsTableProps) {
  const t = useTranslations('tents');

  const [items, setItems] = useState<Items>({});
  const [membersById, setMembersById] = useState<MembersById>({});
  const [tentsById, setTentsById] = useState<
    Record<
      string,
      { number: string; category: string; capacity: number; color: string }
    >
  >({});
  const [memberToContainer, setMemberToContainer] = useState<MemberToContainer>(
    {}
  );

  useEffect(() => {
    const buildTentsStructure = () => {
      const nextItems: Items = {};
      const nextMembersById: MembersById = {};
      const nextTentsById: Record<
        string,
        { number: string; category: string; capacity: number; color: string }
      > = {};
      const nextMemberToContainer: MemberToContainer = {};

      initialItems?.forEach((tent) => {
        const tentId = String(tent.tentId);
        //const color = genderColorMap[tent.gender] ?? genderColorMap.male;
        nextTentsById[tentId] = {
          number: tent.number,
          category: tent.category,
          capacity: tent.capacity,
          color: genderColorMap[tent.category] ?? genderColorMap.Male,
        };

        nextItems[tentId] =
          tent.members?.map((participant) => {
            const participantId = String(participant.registrationId);
            nextMembersById[participantId] = {
              id: participantId,
              name: participant.name ?? t('unknown-participant'),
              gender: participant.gender,
              city: participant.city,
            };
            nextMemberToContainer[participantId] = tentId;
            return participantId;
          }) ?? [];
      });

      setItems(nextItems);
      setMembersById(nextMembersById);
      setTentsById(nextTentsById);
      setMemberToContainer(nextMemberToContainer);
      setContainers(Object.keys(nextItems) as UniqueIdentifier[]);
      setSavedSnapshot({
        items: cloneItems(nextItems),
        memberToContainer: { ...nextMemberToContainer },
      });
    };

    buildTentsStructure();
  }, [initialItems, t]);

  const [containers, setContainers] = useState<UniqueIdentifier[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const recentlyMovedToNewContainer = useRef(false);
  const lastDragOverPositionRef = useRef<string | null>(null);
  const itemsRef = useRef<Items>(items);
  const memberToContainerRef = useRef<MemberToContainer>(memberToContainer);
  const activeContainerIdRef = useRef<UniqueIdentifier | null>(null);
  const overContainerIdRef = useRef<UniqueIdentifier | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<{
    items: Items;
    memberToContainer: MemberToContainer;
  } | null>(null);
  const [clonedItems, setClonedItems] = useState<Items | null>(null);
  const [activeContainerId, setActiveContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [overContainerId, setOverContainerId] =
    useState<UniqueIdentifier | null>(null);

  const canEditTentInMode = canEditTent && isEditMode;

  useEffect(() => {
    if (!isEditMode) {
      setTentsReorderFlag?.(false);
    }
  }, [isEditMode, setTentsReorderFlag]);

  const isSortingContainer =
    activeId != null ? containers.includes(activeId) : false;

  const handlePopoverOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(e.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);
  const handlePageLimitChange = (newPageLimit: number) => {
    onFiltersChange({ pageLimit: newPageLimit });
    handlePopoverClose();
  };
  const open = Boolean(anchorEl);

  const getIndex = useCallback(
    (id: UniqueIdentifier) => {
      const container = memberToContainer[id];
      if (!container) return -1;
      return items[container]?.indexOf(id) ?? -1;
    },
    [items, memberToContainer]
  );

  const handleSaveReorder = useCallback(async () => {
    if (!onSaveReorder) return;

    try {
      await onSaveReorder(items);
      setSavedSnapshot({
        items: cloneItems(items),
        memberToContainer: { ...memberToContainer },
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving reorder:', error);

      if (savedSnapshot) {
        setItems(cloneItems(savedSnapshot.items));
        setMemberToContainer({ ...savedSnapshot.memberToContainer });
        setContainers(Object.keys(savedSnapshot.items) as UniqueIdentifier[]);
        setHasUnsavedChanges(false);
        setTentsReorderFlag(false);
      }
    }
  }, [
    items,
    onSaveReorder,
    memberToContainer,
    savedSnapshot,
    setTentsReorderFlag,
  ]);

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    memberToContainerRef.current = memberToContainer;
  }, [memberToContainer]);

  const handleDragCancel = useCallback(() => {
    requestAnimationFrame(() => {
      if (clonedItems) {
        setItems(clonedItems);
      }
      setActiveId(null);
      setActiveContainerId(null);
      setOverContainerId(null);
      activeContainerIdRef.current = null;
      overContainerIdRef.current = null;
      setClonedItems(null);
    });
  }, [clonedItems]);

  const page = filters.page || 1;
  const pageLimit = filters.pageLimit || 8;
  const totalItems = total ?? Object.keys(items).length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageLimit));

  const gridItems = useMemo(
    () =>
      containers.map((containerId) => (
        <TentGridItem
          key={containerId}
          containerId={containerId}
          containerIndex={containers.indexOf(containerId)}
          memberIds={items[containerId] || []}
          tentMeta={tentsById[containerId]}
          minimal={minimal}
          scrollable={scrollable}
          containerStyle={containerStyle}
          canEditTentInMode={canEditTentInMode}
          isSortingContainer={isSortingContainer}
          handle={handle}
          getItemStyles={getItemStyles}
          wrapperStyle={wrapperStyle}
          onEdit={onEdit}
          onView={onView}
          onDelete={onDelete}
          canEditTent={canEditTent}
          membersById={membersById}
          isSourceContainer={activeContainerId === containerId}
          isTargetContainer={overContainerId === containerId}
          t={
            t as unknown as (
              key: string,
              options?: Record<string, unknown>
            ) => string
          }
        />
      )),
    [
      containers,
      items,
      tentsById,
      minimal,
      scrollable,
      containerStyle,
      canEditTentInMode,
      isSortingContainer,
      handle,
      getItemStyles,
      wrapperStyle,
      onEdit,
      onView,
      onDelete,
      canEditTent,
      membersById,
      activeContainerId,
      overContainerId,
      t,
    ]
  );

  if (Object.keys(items).length === 0) return <LoadingScreen />;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative',
      }}
    >
      <DragDropProvider
        sensors={sensors}
        onDragStart={(event) => {
          if (!canEditTentInMode) return;
          const source = event.operation.source;
          if (!source) return;
          setActiveId(source.id);
          const sourceContainerId =
            source.id in itemsRef.current
              ? source.id
              : (memberToContainerRef.current[source.id] ?? null);
          activeContainerIdRef.current = sourceContainerId;
          overContainerIdRef.current = sourceContainerId;
          setActiveContainerId(sourceContainerId);
          setOverContainerId(sourceContainerId);
          setClonedItems(itemsRef.current);
          lastDragOverPositionRef.current = null;
          setTentsReorderFlag?.(true);
        }}
        onDragOver={(event) => {
          if (!canEditTentInMode) return;
          const source = event.operation.source;
          const target = event.operation.target;
          if (!source) return;
          const currentItems = itemsRef.current;
          const currentMemberToContainer = memberToContainerRef.current;
          const targetContainerId = target
            ? target.id in currentItems
              ? target.id
              : currentMemberToContainer[target.id]
            : null;
          if (overContainerIdRef.current !== targetContainerId) {
            overContainerIdRef.current = targetContainerId;
            setOverContainerId(targetContainerId);
          }
          let isBelowOverItem = false;
          let overIndex = -1;
          const tShape = target as {
            shape?: { boundingRectangle?: { top: number; height: number } };
          };
          const opShape = event.operation.shape as {
            boundingRectangle?: { top: number };
          } | null;
          if (
            opShape?.boundingRectangle &&
            tShape?.shape?.boundingRectangle &&
            target?.id &&
            !(target.id in currentItems)
          ) {
            const srcTop = opShape.boundingRectangle.top;
            const tgtRect = tShape.shape.boundingRectangle;
            isBelowOverItem = srcTop > tgtRect.top + tgtRect.height;
          }
          if (target && targetContainerId && !(target.id in currentItems)) {
            overIndex =
              currentItems[targetContainerId]?.indexOf(target.id) ?? -1;
          }
          const positionKey = `${String(source.id)}::${String(
            targetContainerId ?? ''
          )}::${String(target?.id ?? '')}::${String(overIndex)}::${
            isBelowOverItem ? 'below' : 'above'
          }`;
          if (lastDragOverPositionRef.current === positionKey) {
            return;
          }
          lastDragOverPositionRef.current = positionKey;

          onDragOver({
            source: { id: source.id },
            target: target ? { id: target.id } : null,
            items: currentItems,
            setItems,
            recentlyMovedToNewContainer,
            memberToContainer: currentMemberToContainer,
            setMemberToContainer,
            isBelowOverItem,
          });
        }}
        onDragEnd={(event) => {
          if (!canEditTentInMode) return;
          const { operation, canceled } = event;
          const source = operation.source;
          const target = operation.target;
          if (!source) return;
          if (canceled) {
            handleDragCancel();
            setTentsReorderFlag?.(false);
            return;
          }
          const currentItems = itemsRef.current;
          const currentMemberToContainer = memberToContainerRef.current;
          onDragEnd({
            source: { id: source.id },
            target: target ? { id: target.id } : null,
            items: currentItems,
            activeId,
            setItems,
            setActiveId,
            setContainers,
            getNextContainerId,
            memberToContainer: currentMemberToContainer,
            setMemberToContainer,
          });
          setHasUnsavedChanges(true);
          setActiveContainerId(null);
          setOverContainerId(null);
          activeContainerIdRef.current = null;
          overContainerIdRef.current = null;
          lastDragOverPositionRef.current = null;
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            pr: 0.5,
            pb: 2,
          }}
        >
          <Grid container spacing={2}>
            {gridItems}
          </Grid>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
          mt={4}
        >
          <Button
            variant="outlined"
            size="small"
            endIcon={<Iconify icon="solar:alt-arrow-down-linear" />}
            onClick={handlePopoverOpen}
            sx={{ minWidth: 120 }}
          >
            {filters.pageLimit || 8} {t('per-page')}
          </Button>

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuList>
              {[4, 8, 12, 16].map((n) => (
                <MenuItem key={n} onClick={() => handlePageLimitChange(n)}>
                  <ListItemText primary={`${n} ${t('per-page')}`} />
                </MenuItem>
              ))}
            </MenuList>
          </Popover>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" mr={2}>
              {(page - 1) * pageLimit + 1}-
              {Math.min(page * pageLimit, total ?? 0)}{' '}
              {t('of-total', { total: total ?? 0 })}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, page) => onFiltersChange?.({ page })}
              color="primary"
            />
          </Box>
        </Stack>

        {createPortal(
          <DragOverlay>
            {(source) =>
              source
                ? containers.includes(source.id)
                  ? renderContainerDragOverlay(source.id)
                  : renderSortableItemDragOverlay(source.id)
                : null
            }
          </DragOverlay>,
          document.body
        )}
        {trashable && activeId && !containers.includes(activeId) ? (
          <Trash id={TRASH_ID} />
        ) : null}
      </DragDropProvider>

      <Fade in={hasUnsavedChanges}>
        <Fab
          color="primary"
          onClick={handleSaveReorder}
          disabled={!canEditTentInMode}
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <Iconify icon="solar:diskette-bold" />
        </Fab>
      </Fade>
    </Box>
  );

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
    const meta = membersById[id];
    return (
      <Item
        value={meta?.name || String(id)}
        handle={handle}
        style={getItemStyles({
          containerId: memberToContainer[id],
          overIndex: -1,
          index: 0,
          value: meta?.name,
          isSorting: true,
          isDragging: true,
          isDragOverlay: true,
        })}
        wrapperStyle={wrapperStyle({ index: 0 })}
        dragOverlay
      >
        <MoreMenu />
      </Item>
    );
  }

  function renderContainerDragOverlay(containerId: UniqueIdentifier) {
    const memberIds = items[containerId] || [];
    const tentMeta = tentsById[containerId];
    const label = tentMeta
      ? t('card-label', { number: tentMeta.number })
      : t('card-label', { number: containerId });

    return (
      <Container
        label={label}
        columns={memberIds.length}
        style={{ height: '100%' }}
        shadow
        unstyled={false}
      >
        {memberIds.map((memberId, index) => {
          const meta = membersById[memberId];
          return (
            <Item
              key={memberId}
              value={meta?.name || String(memberId)}
              handle={handle}
              style={getItemStyles({
                containerId,
                overIndex: -1,
                index: getIndex(memberId),
                value: meta?.name,
                isDragging: false,
                isSorting: false,
                isDragOverlay: false,
              })}
              wrapperStyle={wrapperStyle({ index })}
            />
          );
        })}
        <ContainerButtons
          onEdit={onEdit}
          onView={onView}
          tentId={containerId}
          canEdit={canEditTent}
          onDelete={onDelete}
          disableActions={!canEditTentInMode}
        />
      </Container>
    );
  }

  function getNextContainerId() {
    const containerIds = Object.keys(items);
    const lastContainerId = containerIds[containerIds.length - 1];

    return `${lastContainerId}-new`;
  }
}

function Trash({ id }: { id: UniqueIdentifier }) {
  const { ref, isDropTarget } = useDroppable({ id });

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        left: '50%',
        marginLeft: -150,
        bottom: 20,
        width: 300,
        height: 60,
        borderRadius: 5,
        border: '1px solid',
        borderColor: isDropTarget ? 'red' : '#DDD',
      }}
    >
      Drop here to delete
    </div>
  );
}
