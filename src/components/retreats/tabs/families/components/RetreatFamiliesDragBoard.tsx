import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { PointerActivationConstraints } from '@dnd-kit/dom';
import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/react';

import Lock from '@mui/icons-material/Lock';
import { Box, Grid } from '@mui/material';

import { Container, Item } from '@/src/components/dnd-kit/components';

import ContainerButtons from '../ContainerButtons';
import MoreMenu from '../MoreMenu';
import { FamilyGridItem } from '../RetreatFamiliesCards/FamilyGridItem';
import { TRASH_ID, onDragEnd, onDragOver } from '../shared';
import {
  Items,
  MemberToContainer,
  MembersById,
  RetreatFamiliesProps,
  UniqueIdentifier,
} from '../types';

const sensors = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: 6 }),
    ],
  }),
  KeyboardSensor,
];

function getColor(id: UniqueIdentifier) {
  switch (String(id)[0]) {
    case 'A':
      return '#7193f1';
    case 'B':
      return '#ffda6c';
    case 'C':
      return '#00bcd4';
    case 'D':
      return '#ef769f';
  }
  return undefined;
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

interface RetreatFamiliesDragBoardProps {
  canEditFamilyInMode: boolean;
  setFamiliesReorderFlag: (flag: boolean) => void;
  containers: UniqueIdentifier[];
  setContainers: React.Dispatch<React.SetStateAction<UniqueIdentifier[]>>;
  items: Items;
  setItems: React.Dispatch<React.SetStateAction<Items>>;
  memberToContainer: MemberToContainer;
  setMemberToContainer: React.Dispatch<React.SetStateAction<MemberToContainer>>;
  membersById: MembersById;
  familiesById: Record<string, { name: string; color: string; locked?: boolean }>;
  activeId: UniqueIdentifier | null;
  setActiveId: React.Dispatch<React.SetStateAction<UniqueIdentifier | null>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  getNextContainerId: () => string;
  minimal: boolean;
  scrollable?: boolean;
  containerStyle?: React.CSSProperties;
  handle: boolean;
  wrapperStyle: NonNullable<RetreatFamiliesProps['wrapperStyle']>;
  onEdit: (familyId: UniqueIdentifier) => void;
  onView: (familyId: UniqueIdentifier) => void;
  onDelete?: (familyId: UniqueIdentifier) => void;
  canEditFamily: boolean;
  isEditMode: boolean;
  isSortingContainer: boolean;
  familyValidationErrors: Record<string, string[]>;
  trashable: boolean;
  childrenTop?: React.ReactNode;
}

export default function RetreatFamiliesDragBoard({
  canEditFamilyInMode,
  setFamiliesReorderFlag,
  containers,
  setContainers,
  items,
  setItems,
  memberToContainer,
  setMemberToContainer,
  membersById,
  familiesById,
  activeId,
  setActiveId,
  setHasUnsavedChanges,
  getNextContainerId,
  minimal,
  scrollable,
  containerStyle,
  handle,
  wrapperStyle,
  onEdit,
  onView,
  onDelete,
  canEditFamily,
  isEditMode,
  isSortingContainer,
  familyValidationErrors,
  trashable,
  childrenTop,
}: RetreatFamiliesDragBoardProps) {
  const [activeContainerId, setActiveContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [overContainerId, setOverContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [clonedItems, setClonedItems] = useState<Items | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const lastDragOverPositionRef = useRef<string | null>(null);
  const itemsRef = useRef<Items>(items);
  const memberToContainerRef = useRef<MemberToContainer>(memberToContainer);
  const familiesByIdRef = useRef(familiesById);
  const activeContainerIdRef = useRef<UniqueIdentifier | null>(null);
  const overContainerIdRef = useRef<UniqueIdentifier | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    memberToContainerRef.current = memberToContainer;
  }, [memberToContainer]);

  useEffect(() => {
    familiesByIdRef.current = familiesById;
  }, [familiesById]);

  useEffect(() => {
    if (!canEditFamilyInMode) {
      setFamiliesReorderFlag(false);
      setActiveId(null);
      setActiveContainerId(null);
      setOverContainerId(null);
      activeContainerIdRef.current = null;
      overContainerIdRef.current = null;
    }
  }, [canEditFamilyInMode, setActiveId, setFamiliesReorderFlag]);

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  const handleDragCancel = useCallback(() => {
    if (clonedItems) {
      setItems(clonedItems);
    }
    setActiveId(null);
    setActiveContainerId(null);
    setOverContainerId(null);
    activeContainerIdRef.current = null;
    overContainerIdRef.current = null;
    setClonedItems(null);
  }, [clonedItems, setActiveId, setItems]);

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
    const meta = membersById[id];
    return (
      <Item
        value={meta?.name || String(id)}
        handle={handle}
        color={getColor(id)}
        wrapperStyle={wrapperStyle({ index: 0 })}
        dragOverlay
      >
        <MoreMenu />
      </Item>
    );
  }

  function renderContainerDragOverlay(containerId: UniqueIdentifier) {
    const memberIds = items[containerId] || [];
    const familyName = familiesById[containerId] || containerId;
    return (
      <Container
        label={`Família ${familyName.name}`}
        columns={memberIds.length}
        style={{ height: '100%' }}
        shadow
        unstyled={false}
      >
        {familyName.locked && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 1,
              px: 1,
              py: 0.5,
              bgcolor: 'warning.lighter',
              borderRadius: 1,
            }}
          >
            <Lock sx={{ width: 16, height: 16 }} />
            <Box component="span">Família Bloqueada</Box>
          </Box>
        )}
        {memberIds.map((memberId) => {
          const meta = membersById[memberId];
          return (
            <Item
              key={memberId}
              value={meta?.name || String(memberId)}
              handle={handle}
              color={getColor(memberId)}
              wrapperStyle={wrapperStyle({ index: 0 })}
            />
          );
        })}
        <ContainerButtons
          onEdit={onEdit}
          onView={onView}
          onDelete={onDelete}
          familyId={containerId}
          canEdit={canEditFamily && !familyName.locked}
          disableActions={!isEditMode}
        />
      </Container>
    );
  }

  return (
    <DragDropProvider
      sensors={sensors}
      onBeforeDragStart={(event) => {
        if (!canEditFamilyInMode) {
          event.preventDefault();
          return;
        }
        const sourceId = event.operation.source?.id;
        if (sourceId == null) return;
        const containerId = memberToContainer[sourceId];
        const isLocked = containerId && familiesById[containerId]?.locked;
        if (isLocked) {
          event.preventDefault();
        }
      }}
      onDragStart={(event) => {
        if (!canEditFamilyInMode) return;
        const source = event.operation.source;
        if (!source) return;
        const currentMemberToContainer = memberToContainerRef.current;
        const currentFamiliesById = familiesByIdRef.current;
        const containerId = currentMemberToContainer[source.id];
        const isLocked = containerId && currentFamiliesById[containerId]?.locked;
        if (isLocked) return;

        setActiveId(source.id);
        const sourceContainerId =
          source.id in itemsRef.current
            ? source.id
            : (currentMemberToContainer[source.id] ?? null);
        if (activeContainerIdRef.current !== sourceContainerId) {
          activeContainerIdRef.current = sourceContainerId;
          setActiveContainerId(sourceContainerId);
        }
        if (overContainerIdRef.current !== sourceContainerId) {
          overContainerIdRef.current = sourceContainerId;
          setOverContainerId(sourceContainerId);
        }
        setClonedItems(itemsRef.current);
        lastDragOverPositionRef.current = null;
        setFamiliesReorderFlag?.(true);
      }}
      onDragOver={(event) => {
        if (!canEditFamilyInMode) return;
        const source = event.operation.source;
        const target = event.operation.target;
        if (!source) return;
        const currentItems = itemsRef.current;
        const currentMemberToContainer = memberToContainerRef.current;
        const currentFamiliesById = familiesByIdRef.current;
        const sourceContainerId = currentMemberToContainer[source.id];
        const targetContainerId = target
          ? target.id in currentItems
            ? target.id
            : currentMemberToContainer[target.id]
          : null;

        if (overContainerIdRef.current !== targetContainerId) {
          overContainerIdRef.current = targetContainerId;
          setOverContainerId(targetContainerId);
        }

        const isSourceLocked =
          sourceContainerId && currentFamiliesById[sourceContainerId]?.locked;
        const isTargetLocked =
          targetContainerId && currentFamiliesById[targetContainerId]?.locked;

        if (isSourceLocked || isTargetLocked) return;

        let isBelowOverItem = false;
        let overIndex = -1;
        const t = target as {
          shape?: { boundingRectangle?: { top: number; height: number } };
        };
        const opShape = event.operation.shape as {
          boundingRectangle?: { top: number };
        } | null;
        if (
          opShape?.boundingRectangle &&
          t?.shape?.boundingRectangle &&
          target?.id &&
          !(target.id in currentItems)
        ) {
          const srcTop = opShape.boundingRectangle.top;
          const tgtRect = t.shape.boundingRectangle;
          isBelowOverItem = srcTop > tgtRect.top + tgtRect.height;
        }
        if (target && targetContainerId && !(target.id in currentItems)) {
          overIndex = currentItems[targetContainerId]?.indexOf(target.id) ?? -1;
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
        if (!canEditFamilyInMode) return;
        const { operation, canceled } = event;
        const source = operation.source;
        const target = operation.target;
        if (!source) return;
        const currentItems = itemsRef.current;
        const currentMemberToContainer = memberToContainerRef.current;
        const currentFamiliesById = familiesByIdRef.current;

        const sourceContainerId = currentMemberToContainer[source.id];
        const targetContainerId = target
          ? target.id in currentItems
            ? target.id
            : currentMemberToContainer[target.id]
          : null;

        const isSourceLocked =
          sourceContainerId && currentFamiliesById[sourceContainerId]?.locked;
        const isTargetLocked =
          targetContainerId && currentFamiliesById[targetContainerId]?.locked;

        if (isSourceLocked || isTargetLocked) {
          handleDragCancel();
          setFamiliesReorderFlag?.(false);
          return;
        }

        if (canceled) {
          handleDragCancel();
          setFamiliesReorderFlag?.(false);
          return;
        }

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
      {childrenTop}
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
          {containers.map((containerId) => (
            <FamilyGridItem
              key={containerId}
              containerId={containerId}
              containerIndex={containers.indexOf(containerId)}
              memberIds={items[containerId] || []}
              familyName={familiesById[containerId]}
              minimal={minimal}
              scrollable={scrollable}
              containerStyle={containerStyle}
              canEditFamilyInMode={canEditFamilyInMode}
              isSortingContainer={isSortingContainer}
              handle={handle}
              wrapperStyle={wrapperStyle}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              canEditFamily={canEditFamily}
              isEditMode={isEditMode}
              familyValidationMessages={familyValidationErrors[containerId]}
              membersById={membersById}
              isSourceContainer={activeContainerId === containerId}
              isTargetContainer={overContainerId === containerId}
              getColor={getColor}
            />
          ))}
        </Grid>
      </Box>

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

      {activeId && trashable && canEditFamilyInMode && !containers.includes(activeId) ? (
        <Trash id={TRASH_ID} />
      ) : null}
    </DragDropProvider>
  );
}
