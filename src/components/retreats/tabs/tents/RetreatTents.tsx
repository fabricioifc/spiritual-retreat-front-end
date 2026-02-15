"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { useMenuMode } from "@/src/contexts/users-context/MenuModeContext";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import apiClient from "@/src/lib/axiosClientInstance";
import {
  RetreatsCardTableDateFilters,
  RetreatsCardTableFilters,
} from "../../types";
import getPermission from "@/src/utils/getPermission";
import { useSession } from "next-auth/react";
import { useUrlFilters } from "@/src/hooks/useUrlFilters";
import { useTranslations } from "next-intl";
import { useModal } from "@/src/hooks/useModal";
import { Items } from "./types";
import TentDetails from "./TentDetails";
import LockTentsModal from "./LockTentsModal";
import TentsActionBar from "./TentsActionBar";
import RetreatTentsTable from "./RetreatTentsTable";
import CreateTentForm from "./CreateTentForm";
import AddParticipantToTentForm from "./AddParticipantToTentForm";
import { CreateTentBulkForm } from "./CreateTentBulkForm";
import DeleteTentForm from "./DeleteTentForm";

interface RetreatRequest {
  tents: RetreatTentRoster[];
  version: number;
}

type UniqueIdentifier = string | number;

const getTents = async (
  filters: TableDefaultFilters<
    RetreatsCardTableFilters & RetreatsCardTableDateFilters
  >,
  retreatId: string,
  setTentsVersion: Dispatch<SetStateAction<number>>
): Promise<RetreatRequest> => {
  try {
    const response = await apiClient.get<RetreatRequest>(
      `/retreats/${retreatId}/tents/roster`,
      {
        params: filters,
      }
    );
    setTentsVersion(response.data.version);
    return response.data;
  } catch (error) {
    console.error("Error fetching retreat tents:", error);
    throw new Error("Failed to fetch tents");
  }
};

interface RetreatsProps {
  id: string;
}

export default function RetreatTents({ id: retreatId }: RetreatsProps) {
  const t = useTranslations("tents");
  // const t = useTranslations("tent-details");
  const { filters, updateFilters, activeFiltersCount, resetFilters } =
    useUrlFilters<TableDefaultFilters<RetreatsCardTableFilters>>({
      defaultFilters: {
        page: 1,
        pageLimit: 12,
      },
      excludeFromCount: ["page", "pageLimit"],
    });

  const session = useSession();
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [tentsReorderFlag, setTentsReorderFlag] = useState<boolean>(false);
  const [tentsVersion, setTentsVersion] = useState<number>(0);
  const modal = useModal();
  const { menuMode } = useMenuMode();
  const isEditMode = menuMode === "edit";

  useEffect(() => {
    if (!isEditMode && tentsReorderFlag) {
      setTentsReorderFlag(false);
    }
  }, [isEditMode, tentsReorderFlag]);

  useEffect(() => {
    if (session.data && session.data.user) {
      setHasCreatePermission(
        getPermission({
          permissions: session.data.user.permissions,
          permission: "retreats.create",
          role: session.data.user.role,
        })
      );
    }
  }, [session.data]);

  const queryClient = useQueryClient();
  const {
    data: tentsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["retreat-tents", filters],
    queryFn: () => getTents(filters, retreatId, setTentsVersion),
    staleTime: 60_000,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const invalidateTentsQuery = () => {
    queryClient.invalidateQueries({
      queryKey: ["retreat-tents"],
    });
  };

  const tentsDataArray: RetreatTentRoster[] = useMemo(() => {
    if (!tentsData) {
      return [];
    }

    const { tents } = tentsData;

    if (Array.isArray(tents)) {
      return tents;
    }

    return tents ? [tents] : [];
  }, [tentsData]);

  const canEdit = useMemo(() => {
    const user = session.data?.user;
    if (!user) {
      return false;
    }

    return getPermission({
      permissions: user.permissions,
      permission: "retreats.update",
      role: user.role,
    });
  }, [session.data]);

  const canEditTentInMode = canEdit && isEditMode;

  const handleOpenLock = useCallback(() => {
    if (!isEditMode) return;
    modal.open({
      title: t("lock.title", {
        defaultMessage: "Lock service tents",
      }),
      size: "md",
      customRender() {
        return (
          <LockTentsModal
            retreatId={retreatId}
            onCancel={modal.close}
            onSuccess={() => {
              modal.close?.();
              invalidateTentsQuery();
            }}
          />
        );
      },
    });
  }, [isEditMode, modal, t, retreatId, invalidateTentsQuery]);

  const openTentDetails = useCallback(
    (tentId: UniqueIdentifier, startInEdit = false) => {
      const tent = tentsDataArray.find(
        (item) => String(item.tentId) === String(tentId)
      );

      if (!tent) {
        return;
      }

      modal.open({
        title: t("title", { number: tent.number }),
        size: "md",
        customRender() {
          return (
            <TentDetails
              tentId={tent.tentId}
              tent={tent}
              retreatId={retreatId}
              canEdit={canEdit}
              startInEdit={startInEdit && canEdit}
              onClose={modal.close}
              onUpdated={(updatedTent) => {
                queryClient.setQueryData<RetreatRequest | undefined>(
                  ["retreat-tents", filters],
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  //@ts-ignore
                  (previous) => {
                    if (!previous) {
                      return previous;
                    }

                    if (Array.isArray(previous.tents)) {
                      return {
                        ...previous,
                        tents: previous.tents.map((row) =>
                          row.tentId === updatedTent.tentId
                            ? {
                                ...row,
                                number: updatedTent.number,
                                capacity: updatedTent.capacity,
                                notes: updatedTent.notes,
                                gender: updatedTent.gender,
                                isLocked: updatedTent.isLocked,
                                isActive: updatedTent.isActive,
                                assignedCount: updatedTent.assignedCount,
                                members: updatedTent.members,
                              }
                            : row
                        ),
                      };
                    }

                    return previous;
                  }
                );

                queryClient.invalidateQueries({
                  queryKey: ["retreat-tents"],
                });
              }}
            />
          );
        },
      });
    },
    [tentsDataArray, modal, t, retreatId, canEdit, queryClient, filters]
  );

  const handleEdit = useCallback(
    (tentId: UniqueIdentifier) => {
      openTentDetails(tentId, true);
    },
    [openTentDetails]
  );

  const handleView = useCallback(
    (tentId: UniqueIdentifier) => {
      openTentDetails(tentId, false);
    },
    [openTentDetails]
  );

  const handleDelete = useCallback(
    (tentId: UniqueIdentifier) => {
      if (!canEditTentInMode) return;
      const tent = tentsDataArray.find(
        (item) => String(item.tentId) === String(tentId)
      );

      modal.open({
        title: t("delete-tent"),
        size: "sm",
        customRender() {
          return (
            <DeleteTentForm
              retreatId={retreatId}
              tentId={String(tentId)}
              tentNumber={tent?.number}
              onSuccess={() => {
                modal.close?.();
                invalidateTentsQuery();
              }}
              onCancel={() => modal.close?.()}
            />
          );
        },
      });
    },
    [
      tentsDataArray,
      canEditTentInMode,
      modal,
      t,
      retreatId,
      invalidateTentsQuery,
    ]
  );

  const handleAddParticipantInTent = useCallback(() => {
    if (!isEditMode) return;
    modal.open({
      title: t("addParticipantToTent"),
      size: "md",
      customRender() {
        return (
          <AddParticipantToTentForm
            retreatId={retreatId}
            tentsDataArray={tentsDataArray}
            onSuccess={() => {
              modal.close?.();
              invalidateTentsQuery();
            }}
          />
        );
      },
    });
  }, [isEditMode, tentsDataArray, modal, t, retreatId, invalidateTentsQuery]);

  const createIndividualTent = () => {
    if (!isEditMode) return;
    modal.open({
      title: t("createIndividual"),
      size: "md",
      customRender() {
        return (
          <CreateTentForm
            retreatId={retreatId}
            onSuccess={() => {
              modal.close?.();
              queryClient.invalidateQueries({ queryKey: ["retreat-tents"] });
            }}
          />
        );
      },
    });
  };

  const createTentBulk = () => {
    if (!isEditMode) return;
    modal.open({
      title: t("createBulk"),
      size: "md",
      customRender() {
        return (
          <CreateTentBulkForm
            retreatId={retreatId}
            onSuccess={() => {
              modal.close?.();
              queryClient.invalidateQueries({ queryKey: ["retreat-tents"] });
            }}
          />
        );
      },
    });
  };

  const handleSaveReorder = useCallback(
    async (items: Items) => {
      if (!canEditTentInMode) return;
      try {
        // Transform items to the format expected by the API
        const tents = Object.entries(items).map(([tentId, participantIds]) => ({
          tentId,
          members: participantIds.map((registrationId, position) => ({
            registrationId: String(registrationId),
            position,
          })),
        }));

        const payload = {
          retreatId,
          version: tentsVersion,
          tents,
        };

        await apiClient.put(`/retreats/${retreatId}/tents/roster`, payload);

        setTentsReorderFlag(false);

        // Refetch tents data to get updated order
        queryClient.invalidateQueries({ queryKey: ["retreat-tents"] });

        enqueueSnackbar("Barracas reordenadas com sucesso!", {
          variant: "success",
        });
      } catch (error) {
        console.error("Error saving tents reorder:", error);
        enqueueSnackbar("Erro ao reordenar barracas", { variant: "error" });
        queryClient.invalidateQueries({ queryKey: ["retreat-tents"] });
        throw error;
      }
    },
    [canEditTentInMode, retreatId, tentsVersion, queryClient]
  );

  const handleFiltersChange = (
    newFilters: TableDefaultFilters<RetreatsCardTableFilters>
  ) => {
    updateFilters({ ...filters, ...newFilters });
  };

  const handleApplyFilters = (
    newFilters: Partial<TableDefaultFilters<RetreatsCardTableFilters>>
  ) => {
    updateFilters({ ...filters, ...newFilters });
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        pt: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <TentsActionBar
          hasCreatePermission={hasCreatePermission}
          isReordering={tentsReorderFlag}
          isEditMode={isEditMode}
          filters={filters}
          activeFiltersCount={activeFiltersCount}
          onCreateTent={createIndividualTent}
          onAddParticipant={handleAddParticipantInTent}
          onConfigure={() => {}}
          onCreateTentBulk={createTentBulk}
          onLock={handleOpenLock}
          onApplyFilters={handleApplyFilters}
          onResetFilters={resetFilters}
        />
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {isLoading && (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: "100%" }}
          >
            <CircularProgress />
          </Stack>
        )}
        {isError && (
          <Typography color="error">Erro ao carregar barracas.</Typography>
        )}
        {!isLoading && !isError && (
          <RetreatTentsTable
            setTentsReorderFlag={setTentsReorderFlag}
            onSaveReorder={handleSaveReorder}
            total={tentsData?.tents.length || 0}
            filters={filters}
            items={tentsDataArray}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onFiltersChange={handleFiltersChange}
            retreatId={retreatId}
            canEditTent={canEdit}
            isEditMode={isEditMode}
          />
        )}
      </Box>
    </Container>
  );
}
