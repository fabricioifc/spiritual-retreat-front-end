"use client";

import React from "react";
import { Box } from "@mui/material";

import ContainerButtons from "../ContainerButtons";
import { ValidationError } from "../hooks/useRulesValidations";
import { MembersById } from "../types";

import DroppableContainer from "./DroppableContainer";
import SortableItem from "./SortableItem";

type UniqueIdentifier = string | number;

export interface ServiceTeamCardProps {
  containerId: UniqueIdentifier;
  containerIndex: number;
  memberIds: UniqueIdentifier[];
  spaceName: { name: string; color: string };
  minimal: boolean;
  scrollable?: boolean;
  containerStyle?: React.CSSProperties;
  canEditServiceTeamInMode: boolean;
  isSortingContainer: boolean;
  handle: boolean;
  wrapperStyle: ({ index }: { index: number }) => React.CSSProperties;
  onEdit: (spaceId: UniqueIdentifier) => void;
  onView: (spaceId: UniqueIdentifier) => void;
  onDelete: (spaceId: UniqueIdentifier) => void;
  canEditServiceTeam: boolean;
  isEditMode: boolean;
  reorderFlag: boolean;
  membersById: MembersById;
  validationError?: ValidationError;
  isSourceContainer: boolean;
  isTargetContainer: boolean;
  getColor: (id: UniqueIdentifier) => string | undefined;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function ServiceTeamCard({
  containerId,
  containerIndex,
  memberIds,
  spaceName,
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
  canEditServiceTeam,
  isEditMode,
  reorderFlag,
  membersById,
  validationError,
  isSourceContainer,
  isTargetContainer,
  getColor,
  t,
}: ServiceTeamCardProps) {
  return (
    <DroppableContainer
      key={containerId}
      id={containerId}
      index={containerIndex}
      label={
        minimal
          ? undefined
          : t("team-label", {
              defaultMessage: "Service team {name}",
              name: spaceName.name,
            })
      }
      color={spaceName.color}
      items={memberIds}
      scrollable={scrollable}
      style={containerStyle}
      unstyled={minimal}
      disabled={!canEditServiceTeamInMode}
      isSourceContainer={isSourceContainer}
      isTargetContainer={isTargetContainer}
      isEmpty={memberIds.length === 0}
    >
      {memberIds.length > 0 ? (
        memberIds.map((memberId, index) => {
          const meta = membersById[memberId];
          return (
            <SortableItem
              disabled={!canEditServiceTeamInMode || isSortingContainer}
              key={memberId}
              id={memberId}
              value={meta?.name || String(memberId)}
              index={index}
              handle={handle}
              wrapperStyle={wrapperStyle}
              group={containerId}
              getColor={getColor}
            />
          );
        })
      ) : (
        <Box
          sx={{
            mt: 1,
            p: 2,
            minHeight: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "text.secondary",
            fontSize: "0.875rem",
            borderRadius: 1,
            border: "1px dashed",
            borderColor: isTargetContainer ? "warning.main" : "divider",
            backgroundColor: isTargetContainer
              ? "rgba(255, 167, 38, 0.08)"
              : "transparent",
            transition: "border-color 180ms ease, background-color 180ms ease",
          }}
        >
          {t("no-members", {
            defaultMessage: "No members assigned",
          })}
        </Box>
      )}
      <ContainerButtons
        reorderFlag={reorderFlag}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        serviceTeamId={containerId}
        canEdit={canEditServiceTeam}
        disableActions={!isEditMode}
        validationError={validationError}
      />
    </DroppableContainer>
  );
}
