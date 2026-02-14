import React from 'react';

import { Grid } from '@mui/material';

import FamilyCard, { FamilyCardProps } from './FamilyCard';

const GRID_CARD_SIZE = { xs: 12, md: 6, lg: 4 } as const;

export const FamilyGridItem = React.memo(function FamilyGridItem(
  props: FamilyCardProps
) {
  return (
    <Grid size={GRID_CARD_SIZE}>
      <FamilyCard {...props} />
    </Grid>
  );
}, areFamilyGridItemPropsEqual);

function areFamilyGridItemPropsEqual(prev: FamilyCardProps, next: FamilyCardProps) {
  return (
    prev.containerId === next.containerId &&
    prev.containerIndex === next.containerIndex &&
    prev.memberIds === next.memberIds &&
    prev.familyName === next.familyName &&
    prev.minimal === next.minimal &&
    prev.scrollable === next.scrollable &&
    prev.containerStyle === next.containerStyle &&
    prev.canEditFamilyInMode === next.canEditFamilyInMode &&
    prev.isSortingContainer === next.isSortingContainer &&
    prev.handle === next.handle &&
    prev.wrapperStyle === next.wrapperStyle &&
    prev.onEdit === next.onEdit &&
    prev.onView === next.onView &&
    prev.onDelete === next.onDelete &&
    prev.canEditFamily === next.canEditFamily &&
    prev.isEditMode === next.isEditMode &&
    prev.familyValidationMessages === next.familyValidationMessages &&
    prev.membersById === next.membersById &&
    prev.isSourceContainer === next.isSourceContainer &&
    prev.isTargetContainer === next.isTargetContainer &&
    prev.getColor === next.getColor
  );
}
