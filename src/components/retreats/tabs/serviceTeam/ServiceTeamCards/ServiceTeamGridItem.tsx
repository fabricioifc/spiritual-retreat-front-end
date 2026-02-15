"use client";

import React from "react";
import { Grid } from "@mui/material";

import ServiceTeamCard, { ServiceTeamCardProps } from "./ServiceTeamCard";

const GRID_CARD_SIZE = { xs: 12, md: 6, lg: 4 } as const;

export const ServiceTeamGridItem = React.memo(function ServiceTeamGridItem(
  props: ServiceTeamCardProps
) {
  return (
    <Grid size={GRID_CARD_SIZE}>
      <ServiceTeamCard {...props} />
    </Grid>
  );
}, areServiceTeamGridItemPropsEqual);

function areServiceTeamGridItemPropsEqual(
  prev: ServiceTeamCardProps,
  next: ServiceTeamCardProps
) {
  return (
    prev.containerId === next.containerId &&
    prev.containerIndex === next.containerIndex &&
    prev.memberIds === next.memberIds &&
    prev.spaceName === next.spaceName &&
    prev.minimal === next.minimal &&
    prev.scrollable === next.scrollable &&
    prev.containerStyle === next.containerStyle &&
    prev.canEditServiceTeamInMode === next.canEditServiceTeamInMode &&
    prev.isSortingContainer === next.isSortingContainer &&
    prev.handle === next.handle &&
    prev.wrapperStyle === next.wrapperStyle &&
    prev.onEdit === next.onEdit &&
    prev.onView === next.onView &&
    prev.onDelete === next.onDelete &&
    prev.canEditServiceTeam === next.canEditServiceTeam &&
    prev.isEditMode === next.isEditMode &&
    prev.reorderFlag === next.reorderFlag &&
    prev.membersById === next.membersById &&
    prev.validationError === next.validationError &&
    prev.isSourceContainer === next.isSourceContainer &&
    prev.isTargetContainer === next.isTargetContainer &&
    prev.getColor === next.getColor &&
    prev.t === next.t
  );
}
