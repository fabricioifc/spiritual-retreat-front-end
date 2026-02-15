"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
} from "@dnd-kit/react";
import { Box, Grid } from "@mui/material";

import { Container, Item } from "@/src/components/dnd-kit/components";

import ContainerButtons from "../ContainerButtons";
import MoreMenu from "../MoreMenu";
import { ServiceTeamGridItem } from "../ServiceTeamCards";
import { ValidationError } from "../hooks/useRulesValidations";
import { onDragEnd, onDragOver, TRASH_ID } from "../shared";
import { Items, MemberToContainer, MembersById } from "../types";

type UniqueIdentifier = string | number;

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
    case "A":
      return "#7193f1";
    case "B":
      return "#ffda6c";
    case "C":
      return "#00bcd4";
    case "D":
      return "#ef769f";
  }

  return undefined;
}

interface RetreatServiceTeamDragBoardProps {
  canEditServiceTeamInMode: boolean;
  setServiceTeamReorderFlag: (flag: boolean) => void;
  items: Items;
  setItems: React.Dispatch<React.SetStateAction<Items>>;
  containers: UniqueIdentifier[];
  setContainers: React.Dispatch<React.SetStateAction<UniqueIdentifier[]>>;
  memberToContainer: MemberToContainer;
  setMemberToContainer: React.Dispatch<React.SetStateAction<MemberToContainer>>;
  membersById: MembersById;
  spacesById: Record<string, { name: string; color: string }>;
  activeId: UniqueIdentifier | null;
  setActiveId: React.Dispatch<React.SetStateAction<UniqueIdentifier | null>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  getNextContainerId: () => string;
  minimal: boolean;
  scrollable?: boolean;
  containerStyle?: React.CSSProperties;
  handle: boolean;
  wrapperStyle: ({ index }: { index: number }) => React.CSSProperties;
  onEdit: (spaceId: UniqueIdentifier) => void;
  onView: (spaceId: UniqueIdentifier) => void;
  onDelete: (spaceId: UniqueIdentifier) => void;
  canEditServiceTeam: boolean;
  isEditMode: boolean;
  reorderFlag: boolean;
  validationErrors: ValidationError[];
  t: (key: string, options?: Record<string, unknown>) => string;
  trashable?: boolean;
  childrenTop?: React.ReactNode;
}

export default function RetreatServiceTeamDragBoard({
  canEditServiceTeamInMode,
  setServiceTeamReorderFlag,
  items,
  setItems,
  containers,
  setContainers,
  memberToContainer,
  setMemberToContainer,
  membersById,
  spacesById,
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
  canEditServiceTeam,
  isEditMode,
  reorderFlag,
  validationErrors,
  t,
  trashable,
  childrenTop,
}: RetreatServiceTeamDragBoardProps) {
  const [activeContainerId, setActiveContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [overContainerId, setOverContainerId] =
    useState<UniqueIdentifier | null>(null);
  const [clonedItems, setClonedItems] = useState<Items | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const lastDragOverPositionRef = useRef<string | null>(null);
  const itemsRef = useRef<Items>(items);
  const memberToContainerRef = useRef<MemberToContainer>(memberToContainer);
  const activeContainerIdRef = useRef<UniqueIdentifier | null>(null);
  const overContainerIdRef = useRef<UniqueIdentifier | null>(null);

  const isSortingContainer =
    activeId != null ? containers.includes(activeId) : false;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    memberToContainerRef.current = memberToContainer;
  }, [memberToContainer]);

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

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
  }, [clonedItems, setActiveId, setItems]);

  const handleDeleteDefault = useCallback(() => {
    console.warn("Delete not implemented");
  }, []);

  const gridItems = useMemo(
    () =>
      containers.map((containerId) => {
        const memberIds = items[containerId] || [];
        const spaceName = spacesById[containerId] || {
          name: String(containerId),
          color: "",
        };
        const validationError = validationErrors.find(
          (e) => e.spaceId === String(containerId)
        );

        return (
          <ServiceTeamGridItem
            key={containerId}
            containerId={containerId}
            containerIndex={containers.indexOf(containerId)}
            memberIds={memberIds}
            spaceName={spaceName}
            minimal={minimal}
            scrollable={scrollable}
            containerStyle={containerStyle}
            canEditServiceTeamInMode={canEditServiceTeamInMode}
            isSortingContainer={isSortingContainer}
            handle={handle}
            wrapperStyle={wrapperStyle}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete || handleDeleteDefault}
            canEditServiceTeam={canEditServiceTeam}
            isEditMode={isEditMode}
            reorderFlag={reorderFlag || false}
            membersById={membersById}
            validationError={validationError}
            isSourceContainer={activeContainerId === containerId}
            isTargetContainer={overContainerId === containerId}
            getColor={getColor}
            t={t}
          />
        );
      }),
    [
      containers,
      items,
      spacesById,
      validationErrors,
      minimal,
      scrollable,
      containerStyle,
      canEditServiceTeamInMode,
      isSortingContainer,
      handle,
      wrapperStyle,
      onEdit,
      onView,
      onDelete,
      handleDeleteDefault,
      canEditServiceTeam,
      isEditMode,
      reorderFlag,
      membersById,
      activeContainerId,
      overContainerId,
      t,
    ]
  );

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
    const meta = membersById[id];
    return (
      <Item
        value={meta?.name || String(id)}
        handle={handle}
        style={{
          ...wrapperStyle({ index: 0 }),
          ...{
            opacity: 1,
          },
        }}
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
    const spaceName = spacesById[containerId] || containerId;
    return (
      <Container
        label={t("team-label", {
          defaultMessage: "Service team {name}",
          name: (spaceName as { name: string }).name,
        })}
        columns={memberIds.length}
        style={{ height: "100%" }}
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
              color={getColor(memberId)}
              wrapperStyle={wrapperStyle({ index })}
            />
          );
        })}
        <ContainerButtons
          onEdit={onEdit}
          onView={onView}
          serviceTeamId={containerId}
          canEdit={canEditServiceTeam}
          reorderFlag={reorderFlag || false}
          onDelete={onDelete || handleDeleteDefault}
          disableActions={!isEditMode}
        />
      </Container>
    );
  }

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={(event) => {
        if (!canEditServiceTeamInMode) {
          return;
        }
        const source = event.operation.source;
        if (!source) return;
        setActiveId(source.id);
        const sourceContainerId =
          source.id in itemsRef.current
            ? source.id
            : (memberToContainerRef.current[source.id] ?? null);
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
        setServiceTeamReorderFlag?.(true);
      }}
      onDragOver={(event) => {
        if (!canEditServiceTeamInMode) {
          return;
        }
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
          overIndex = currentItems[targetContainerId]?.indexOf(target.id) ?? -1;
        }
        const positionKey = `${String(source.id)}::${String(
          targetContainerId ?? ""
        )}::${String(target?.id ?? "")}::${String(overIndex)}::${
          isBelowOverItem ? "below" : "above"
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
        if (!canEditServiceTeamInMode) {
          return;
        }
        const { operation, canceled } = event;
        const source = operation.source;
        const target = operation.target;
        if (!source) return;
        if (canceled) {
          handleDragCancel();
          setServiceTeamReorderFlag?.(false);
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
      {childrenTop}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          pr: 0.5,
          pb: 2,
        }}
      >
        <Grid container spacing={2}>
          {gridItems}
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
      {trashable && activeId && canEditServiceTeamInMode && !containers.includes(activeId) ? (
        <Trash id={TRASH_ID} />
      ) : null}
    </DragDropProvider>
  );
}

function Trash({ id }: { id: UniqueIdentifier }) {
  const { ref, isDropTarget } = useDroppable({ id });

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        left: "50%",
        marginLeft: -150,
        bottom: 20,
        width: 300,
        height: 60,
        borderRadius: 5,
        border: "1px solid",
        borderColor: isDropTarget ? "red" : "#DDD",
      }}
    >
      Drop here to delete
    </div>
  );
}
