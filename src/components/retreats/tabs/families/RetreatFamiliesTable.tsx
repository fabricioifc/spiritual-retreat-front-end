/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useTranslations } from 'next-intl';

import Save from '@mui/icons-material/Save';
import { Box, Fab, Fade, Typography } from '@mui/material';

import { LoadingScreen } from '@/src/components/loading-screen';
import apiClient from '@/src/lib/axiosClientInstance';

import RetreatFamiliesDragBoard from './components/RetreatFamiliesDragBoard';
import {
  Items,
  MemberToContainer,
  MembersById,
  RetreatFamiliesProps,
} from './types';

type UniqueIdentifier = string | number;
const DEFAULT_ITEM_STYLES = () => ({});
const DEFAULT_WRAPPER_STYLE = () => ({});

interface GenderBalanceRule {
  enabled: boolean;
  ratio: number;
  tolerance?: number;
  label?: string;
}

interface FamilyCompositionRules {
  maxMembersPerFamily?: number;
  genderBalance?: GenderBalanceRule;
  preventSameRealFamily?: boolean;
  preventSameCity?: boolean;
}

interface FamilyCompositionRulesResponse {
  success: boolean;
  retreatId?: string;
  rules: FamilyCompositionRules;
}

function findDuplicateValues(values: Array<string | undefined>): string[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    if (!value) {
      return;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function cloneItems(source: Items): Items {
  return Object.fromEntries(
    Object.entries(source).map(([k, v]) => [k, [...v]])
  );
}

export default function RetreatFamiliesTable({
  items: InitialItems,
  handle = true,
  containerStyle,
  getItemStyles = DEFAULT_ITEM_STYLES,
  wrapperStyle = DEFAULT_WRAPPER_STYLE,
  minimal = false,
  trashable = false,
  vertical = false,
  scrollable,
  onFiltersChange,
  filters,
  onView,
  onEdit,
  onDelete,
  total,
  setFamiliesReorderFlag,
  onSaveReorder,
  retreatId,
  canEditFamily,
  isEditMode,
  loading,
}: RetreatFamiliesProps) {
  const t = useTranslations('family-validation');
  const canEditFamilyInMode = canEditFamily && isEditMode;

  const [compositionRules, setCompositionRules] =
    useState<FamilyCompositionRules | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  useEffect(() => {
    if (!retreatId) {
      return;
    }

    let isActive = true;

    const loadRules = async () => {
      setRulesLoading(true);
      setRulesError(null);

      try {
        const response = await apiClient.get(
          `/retreats/${retreatId}/families/rules`
        );

        if (!isActive) {
          return;
        }

        if (response.data && response.data?.rules) {
          setCompositionRules(response.data.rules);
        } else {
          setCompositionRules(null);
          setRulesError(response.statusText || t('fetch-error'));
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error('Error fetching family composition rules:', error);
        setCompositionRules(null);
        setRulesError(
          error instanceof Error ? error.message : t('fetch-error')
        );
      } finally {
        if (!isActive) {
          return;
        }

        setRulesLoading(false);
      }
    };

    void loadRules();

    return () => {
      isActive = false;
    };
  }, [retreatId, t]);

  const [items, setItems] = useState<Items>({});
  const [membersById, setMembersById] = useState<MembersById>({});
  const [familiesById, setFamiliesById] = useState<
    Record<string, { name: string; color: string; locked?: boolean }>
  >({});
  const [memberToContainer, setMemberToContainer] = useState<MemberToContainer>(
    {}
  );

  useEffect(() => {
    const buildFamiliesStructure = () => {
      const items: Items = {};
      const membersById: MembersById = {};
      const familiesById: Record<
        string,
        { name: string; color: string; locked?: boolean }
      > = {};
      const memberToContainer: MemberToContainer = {};

      InitialItems?.forEach((fam) => {
        const fid = String(fam.familyId);
        familiesById[fid] = {
          name: fam.name,
          color: fam.color || '',
          locked: Boolean(
            typeof fam.locked !== 'undefined' ? fam.locked : fam.isLocked
          ),
        };
        items[fid] =
          fam.members?.map((m) => {
            const mid = String(m.registrationId);
            membersById[mid] = {
              registrationId: mid,
              name: m.name as string,
              gender: m.gender,
              city: m.city,
              position: m.position,
            };
            memberToContainer[mid] = fid;
            return mid;
          }) || [];
      });

      setItems(items);
      setMembersById(membersById);
      setFamiliesById(familiesById);
      setMemberToContainer(memberToContainer);
      setContainers(Object.keys(items) as UniqueIdentifier[]);

      setSavedSnapshot({
        items: cloneItems(items),
        memberToContainer: { ...memberToContainer },
      });
    };
    buildFamiliesStructure();
  }, [InitialItems]);

  const [containers, setContainers] = useState<UniqueIdentifier[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!canEditFamilyInMode) {
      setFamiliesReorderFlag(false);
      setHasUnsavedChanges(false);
      setActiveId(null);
    }
  }, [canEditFamilyInMode, setFamiliesReorderFlag]);

  const [savedSnapshot, setSavedSnapshot] = useState<{
    items: Items;
    memberToContainer: MemberToContainer;
  } | null>(null);

  const familyValidationErrors = useMemo(() => {
    if (activeId) {
      return {};
    }

    if (!compositionRules) {
      return {};
    }

    const errors: Record<string, string[]> = {};
    const genderTolerance = compositionRules.genderBalance?.tolerance ?? 0;

    Object.entries(items).forEach(([familyId, memberIds]) => {
      const messages: string[] = [];
      const familyName = familiesById[familyId] || familyId;

      if (
        compositionRules.maxMembersPerFamily &&
        memberIds.length > compositionRules.maxMembersPerFamily
      ) {
        messages.push(
          t('max-members', {
            family: familyName.name,
            count: memberIds.length,
            max: compositionRules.maxMembersPerFamily,
          })
        );
      }

      if (compositionRules.genderBalance?.enabled) {
        const maleCount = memberIds.filter(
          (id) => membersById[id]?.gender === 'male'
        ).length;
        const femaleCount = memberIds.filter(
          (id) => membersById[id]?.gender === 'female'
        ).length;
        const participantsWithGender = maleCount + femaleCount;

        if (
          participantsWithGender > 0 &&
          Math.abs(maleCount - femaleCount) > genderTolerance
        ) {
          messages.push(
            t('gender-balance', {
              family: familyName.name,
              male: maleCount,
              female: femaleCount,
            })
          );
        }
      }

      if (compositionRules.preventSameCity) {
        const duplicates = findDuplicateValues(
          memberIds.map((id) => membersById[id]?.city)
        );

        if (duplicates.length > 0) {
          messages.push(
            t('same-city', {
              family: familyName.name,
              duplicates: duplicates.join(', '),
            })
          );
        }
      }

      if (messages.length > 0) {
        errors[familyId] = messages;
      }
    });

    return errors;
  }, [activeId, compositionRules, items, membersById, familiesById, t]);

  const handleSaveReorder = useCallback(async () => {
    if (!onSaveReorder || !canEditFamilyInMode) return;

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
        setFamiliesReorderFlag(false);
      }
    }
  }, [
    canEditFamilyInMode,
    items,
    memberToContainer,
    onSaveReorder,
    savedSnapshot,
    setFamiliesReorderFlag,
  ]);

  const isSortingContainer =
    activeId != null ? containers.includes(activeId) : false;

  if (loading) return <LoadingScreen />;

  const getNextContainerId = () => {
    const containerIds = Object.keys(items);
    const lastContainerId = containerIds[containerIds.length - 1];
    return String.fromCharCode((lastContainerId?.charCodeAt(0) ?? 64) + 1);
  };

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
      {rulesLoading && !rulesError && (
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {t('loading')}
          </Typography>
        </Box>
      )}
      {rulesError && (
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Typography color="error" variant="body2">
            {rulesError}
          </Typography>
        </Box>
      )}
      <RetreatFamiliesDragBoard
        canEditFamilyInMode={canEditFamilyInMode}
        setFamiliesReorderFlag={setFamiliesReorderFlag}
        containers={containers}
        setContainers={setContainers}
        items={items}
        setItems={setItems}
        memberToContainer={memberToContainer}
        setMemberToContainer={setMemberToContainer}
        membersById={membersById}
        familiesById={familiesById}
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
        onDelete={onDelete}
        canEditFamily={canEditFamily}
        isEditMode={isEditMode}
        isSortingContainer={isSortingContainer}
        familyValidationErrors={familyValidationErrors}
        trashable={trashable}
      />

      <Fade in={hasUnsavedChanges && canEditFamilyInMode}>
        <Fab
          color="primary"
          disabled={!canEditFamilyInMode}
          onClick={handleSaveReorder}
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <Save />
        </Fab>
      </Fade>
    </Box>
  );
}
