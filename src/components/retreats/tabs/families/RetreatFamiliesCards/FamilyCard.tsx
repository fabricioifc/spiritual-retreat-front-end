import React from 'react';

import Lock from '@mui/icons-material/Lock';
import { Box, Stack, Typography } from '@mui/material';

import ContainerButtons from '../ContainerButtons';
import { MembersById, RetreatFamiliesProps, UniqueIdentifier } from '../types';

import DroppableContainer from './DroppableContainer';
import SortableItem from './SortableItem';

export interface FamilyCardProps {
  containerId: UniqueIdentifier;
  containerIndex: number;
  memberIds: UniqueIdentifier[];
  familyName?: { name: string; color: string; locked?: boolean };
  minimal: boolean;
  scrollable?: boolean;
  containerStyle?: React.CSSProperties;
  canEditFamilyInMode: boolean;
  isSortingContainer: boolean;
  handle: boolean;
  wrapperStyle: NonNullable<RetreatFamiliesProps['wrapperStyle']>;
  onEdit: (familyId: UniqueIdentifier) => void;
  onView: (familyId: UniqueIdentifier) => void;
  onDelete?: (familyId: UniqueIdentifier) => void;
  canEditFamily: boolean;
  isEditMode: boolean;
  familyValidationMessages?: string[];
  membersById: MembersById;
  isSourceContainer: boolean;
  isTargetContainer: boolean;
  getColor: (id: UniqueIdentifier) => string | undefined;
}

const FamilyCard = React.memo(function FamilyCard({
  containerId,
  containerIndex,
  memberIds,
  familyName,
  minimal,
  scrollable,
  containerStyle,
  canEditFamilyInMode,
  isSortingContainer,
  handle,
  wrapperStyle,
  onEdit,
  onView,
  onDelete,
  canEditFamily,
  isEditMode,
  familyValidationMessages,
  membersById,
  isSourceContainer,
  isTargetContainer,
  getColor,
}: FamilyCardProps) {
  const family = familyName ?? {
    name: String(containerId),
    color: '',
    locked: false,
  };

  return (
    <DroppableContainer
      key={containerId}
      id={containerId}
      index={containerIndex}
      label={minimal ? undefined : `Família ${family.name}`}
      color={family.color}
      items={memberIds}
      scrollable={scrollable}
      style={containerStyle}
      unstyled={minimal}
      disabled={family.locked || !canEditFamilyInMode}
      isSourceContainer={isSourceContainer}
      isTargetContainer={isTargetContainer}
    >
      {family.locked && (
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
          <Typography variant="caption" color="warning.dark">
            Família Bloqueada
          </Typography>
        </Box>
      )}

      {memberIds.map((memberId, index) => {
        const meta = membersById[memberId];
        return (
          <SortableItem
            disabled={
              !canEditFamilyInMode || isSortingContainer || family.locked
            }
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
      })}

      <ContainerButtons
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        familyId={containerId}
        canEdit={canEditFamily && !family.locked}
        disableActions={!isEditMode}
      />

      {familyValidationMessages?.length ? (
        <Stack spacing={0.5} mt={1}>
          {familyValidationMessages.map((message, idx) => (
            <Typography
              key={`${containerId}-validation-error-${idx}`}
              variant="caption"
              color="error"
              display="block"
            >
              {message}
            </Typography>
          ))}
        </Stack>
      ) : null}
    </DroppableContainer>
  );
});

export default FamilyCard;
