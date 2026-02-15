"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Fab, Fade } from "@mui/material";

import Iconify from "@/src/components/Iconify";
import { LoadingScreen } from "@/src/components/loading-screen";

import RetreatServiceTeamDragBoard from "./components/RetreatServiceTeamDragBoard";
import { useServiceTeamValidation } from "./hooks/useRulesValidations";
import { Items, MemberToContainer, MembersById, ServiceSpaceTableProps } from "./types";

type UniqueIdentifier = string | number;
const DEFAULT_WRAPPER_STYLE = () => ({});

function cloneItems(source: Items): Items {
  return Object.fromEntries(
    Object.entries(source).map(([k, v]) => [k, [...v]])
  );
}

export default function RetreatServiceTeamTable({
  items: InitialItems,
  handle = true,
  containerStyle,
  wrapperStyle = DEFAULT_WRAPPER_STYLE,
  minimal = false,
  trashable = false,
  scrollable,
  onView,
  onEdit,
  onDelete,
  setServiceTeamReorderFlag,
  reorderFlag,
  onSaveReorder,
  canEditServiceTeam,
  isEditMode,
}: ServiceSpaceTableProps) {
  const t = useTranslations("service-team");

  const canEditServiceTeamInMode = canEditServiceTeam && isEditMode;

  const [items, setItems] = useState<Items>({});
  const [membersById, setMembersById] = useState<MembersById>({});
  const [spacesById, setSpacesById] = useState<
    Record<string, { name: string; color: string }>
  >({});
  const [memberToContainer, setMemberToContainer] = useState<MemberToContainer>(
    {}
  );

  useEffect(() => {
    const buildServiceTeamStructure = () => {
      const items: Items = {};
      const membersById: MembersById = {};
      const spacesById: Record<string, { name: string; color: string }> = {};
      const memberToContainer: MemberToContainer = {};

      InitialItems?.forEach((st) => {
        const fid = String(st.spaceId);
        spacesById[fid] = { name: st.name, color: st.color };
        items[fid] =
          st.members?.map((m) => {
            const mid = String(m.registrationId);
            membersById[mid] = {
              registrationId: mid,
              name: m.name as string,
              gender: m.gender,
              role: m.role,
            };
            memberToContainer[mid] = fid;
            return mid;
          }) || [];
      });

      setItems(items);
      setMembersById(membersById);
      setSpacesById(spacesById);
      setMemberToContainer(memberToContainer);
      setContainers(Object.keys(items) as UniqueIdentifier[]);

      // Salva snapshot inicial (clonado)
      setSavedSnapshot({
        items: cloneItems(items),
        memberToContainer: { ...memberToContainer },
      });
    };
    buildServiceTeamStructure();
  }, [InitialItems]);

  const [containers, setContainers] = useState<UniqueIdentifier[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!canEditServiceTeamInMode) {
      setServiceTeamReorderFlag(false);
      setHasUnsavedChanges(false);
      setActiveId(null);
    }
  }, [canEditServiceTeamInMode, setServiceTeamReorderFlag]);

  // Snapshot do estado "persistido" (inicial ou último sucesso)
  const [savedSnapshot, setSavedSnapshot] = useState<{
    items: Items;
    memberToContainer: MemberToContainer;
  } | null>(null);

  const validation = useServiceTeamValidation(InitialItems);

  const handleSaveReorder = useCallback(async () => {
    if (!onSaveReorder || !canEditServiceTeamInMode) return;

    try {
      await onSaveReorder(items);
      // Atualiza snapshot para o estado recém-salvo
      setSavedSnapshot({
        items: cloneItems(items),
        memberToContainer: { ...memberToContainer },
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving reorder:", error);

      // Reverte para o snapshot salvo (inicial ou último sucesso)
      if (savedSnapshot) {
        setItems(cloneItems(savedSnapshot.items));
        setMemberToContainer({ ...savedSnapshot.memberToContainer });
        setContainers(Object.keys(savedSnapshot.items) as UniqueIdentifier[]);
        setHasUnsavedChanges(false);
        setServiceTeamReorderFlag(false);
      }
    }
  }, [
    canEditServiceTeamInMode,
    items,
    onSaveReorder,
    memberToContainer,
    savedSnapshot,
    setServiceTeamReorderFlag,
  ]);

  if (Object.keys(items).length === 0) return <LoadingScreen />;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
      }}
    >
      <RetreatServiceTeamDragBoard
        canEditServiceTeamInMode={canEditServiceTeamInMode}
        setServiceTeamReorderFlag={setServiceTeamReorderFlag}
        items={items}
        setItems={setItems}
        containers={containers}
        setContainers={setContainers}
        memberToContainer={memberToContainer}
        setMemberToContainer={setMemberToContainer}
        membersById={membersById}
        spacesById={spacesById}
        activeId={activeId}
        setActiveId={setActiveId}
        setHasUnsavedChanges={setHasUnsavedChanges}
        getNextContainerId={getNextContainerId}
        minimal={minimal}
        scrollable={scrollable}
        containerStyle={containerStyle}
        handle={handle}
        wrapperStyle={wrapperStyle}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete || (() => undefined)}
        canEditServiceTeam={canEditServiceTeam}
        isEditMode={isEditMode}
        reorderFlag={reorderFlag || false}
        validationErrors={validation.errors}
        t={t as unknown as (key: string, options?: Record<string, unknown>) => string}
        trashable={trashable}
      />

      {/* Floating Save Button */}
      <Fade in={hasUnsavedChanges && canEditServiceTeamInMode}>
        <Fab
          color="primary"
          disabled={!canEditServiceTeamInMode}
          onClick={handleSaveReorder}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          title={t("save-reorder", { defaultMessage: "Save reorder" })}
        >
          <Iconify icon="solar:diskette-bold" />
        </Fab>
      </Fade>
    </Box>
  );

  function getNextContainerId() {
    const containerIds = Object.keys(items);
    const lastContainerId = containerIds[containerIds.length - 1];
    return String.fromCharCode((lastContainerId?.charCodeAt(0) ?? 64) + 1);
  }
}
