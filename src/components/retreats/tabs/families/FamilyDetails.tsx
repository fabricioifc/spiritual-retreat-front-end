"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import Iconify from "@/src/components/Iconify";
import { MuiColorInput } from "mui-color-input";
import apiClient from "@/src/lib/axiosClientInstance";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import { UniqueIdentifier } from "./types";

interface FamilyDetailsProps {
  familyId: UniqueIdentifier;
  retreatId: string;
  canEdit: boolean;
  startInEdit?: boolean;
  onClose?: () => void;
  onUpdated?: (family: RetreatFamily) => void;
}

interface UpdateFamilyPayload {
  name?: string;
  color?: string;
}

export default function FamilyDetails({
  familyId,
  retreatId,
  canEdit,
  startInEdit = false,
  onClose,
  onUpdated,
}: FamilyDetailsProps) {
  const t = useTranslations("family-details");
  const [isEditing, setIsEditing] = useState(startInEdit && canEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [familyState, setFamilyState] = useState<RetreatFamily | null>(null);
  const [familyVersion, setFamilyVersion] = useState<number>(0);
  const [formValues, setFormValues] = useState<UpdateFamilyPayload>({
    name: "",
    color: "",
  });

  // Fetch family data when component mounts or familyId changes
  useEffect(() => {
    const fetchFamilyData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await apiClient.get<{
          version: number;
          family: RetreatFamily;
        }>(`/retreats/${retreatId}/families/${familyId}`);

        const { version, family } = response.data;
        setFamilyState(family);
        setFamilyVersion(version);
        setFormValues({
          name: family.name ?? "",
          color: family.color ?? "",
        });
        setIsEditing(startInEdit && canEdit);
      } catch (error) {
        console.error("Erro ao buscar dados da família:", error);
        const message = axios.isAxiosError(error)
          ? ((error.response?.data as { error?: string })?.error ??
            error.message)
          : t("load-error");
        setErrorMessage(message);
        enqueueSnackbar(message, {
          variant: "error",
          autoHideDuration: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyData();
  }, [familyId, retreatId, startInEdit, canEdit, t]);

  const handleToggleEdit = () => {
    if (!canEdit || !familyState) return;
    setIsEditing((prev) => !prev);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormValues({
      name: familyState.name ?? "",
      color: familyState.color ?? "",
    });
  };

  const handleChange =
    (field: keyof UpdateFamilyPayload) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormValues((prev) => ({ ...prev, [field]: value }));
    };

  const handleSave = async () => {
    if (!familyState) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: formValues.name?.trim(),
        color: formValues.color?.trim() || undefined,
        version: familyVersion,
      };

      const response = await apiClient.put<{
        version: number;
        family: RetreatFamily;
      }>(`/retreats/${retreatId}/families/${familyState.familyId}`, payload);

      const { version, family: updatedFamily } = response.data;

      setFamilyState(updatedFamily);
      setFamilyVersion(version);
      setFormValues({
        name: updatedFamily.name,
        color: updatedFamily.color ?? "",
      });
      setSuccessMessage(t("update-success"));
      enqueueSnackbar(t("update-success"), {
        variant: "success",
      });
      setIsEditing(false);
      onUpdated?.(updatedFamily);
    } catch (error) {
      console.error("Erro ao atualizar família:", error);
      const message = axios.isAxiosError(error)
        ? ((error.response?.data as { error?: string })?.error ?? error.message)
        : t("update-error");
      setErrorMessage(message);
      enqueueSnackbar(message, {
        variant: "error",
        autoHideDuration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const members = familyState?.members ?? [];
  const initialsFromName = (name?: string | null) => {
    if (!name) return "?";

    const initials = name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return initials || "?";
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: 300,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!familyState) {
    return (
      <Box sx={{ width: "100%", minHeight: 300 }}>
        <Alert severity="error">{errorMessage || t("load-error")}</Alert>
        <Button
          variant="outlined"
          onClick={() => onClose?.()}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mt: 2 }}
        >
          {t("close")}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: 300 }}>
      <Stack spacing={1} mt={2}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
            marginBottom={2}
          >
            {t("general-info", { family: familyState.name ?? "" })}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              {isEditing ? (
                <TextField
                  label={t("name-label")}
                  fullWidth
                  value={formValues.name ?? ""}
                  onChange={handleChange("name")}
                  required
                />
              ) : (
                <InfoRow
                  label={t("name-label")}
                  value={familyState?.name ?? ""}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MuiColorInput
                format="hex"
                label={t("family-color")}
                disabled={!isEditing}
                disableAlpha
                value={formValues.color ?? ""}
                onChange={(value) =>
                  setFormValues((prev) => ({ ...prev, ["color"]: value }))
                }
                TextFieldProps={{
                  fullWidth: true,
                  required: true,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow
                label={t("capacity-label")}
                value={`${familyState.totalMembers}/${familyState.capacity}`}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow
                label={t("composition-label")}
                value={`${familyState.maleCount} ${t("male")} / ${familyState.femaleCount} ${t("female")}`}
              />
            </Grid>

            {familyState.isLocked && (
              <Grid size={{ xs: 12 }}>
                <Chip
                  icon={<Iconify icon="solar:lock-bold" />}
                  label={t("family-locked")}
                  color="warning"
                  size="small"
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Alertas */}
        {familyState.alerts?.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                {t("alerts-title")}
              </Typography>
              <Stack spacing={1}>
                {familyState.alerts.map((alert, index) => (
                  <Alert key={index} severity="warning" variant="outlined">
                    {alert}
                  </Alert>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* Informações do Grupo */}
        {familyState.groupStatus && (
          <>
            <Divider />
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                {t("group-info")}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <InfoRow
                    label={t("group-status")}
                    value={familyState.groupStatus}
                  />
                </Grid>
                {familyState.groupChannel && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <InfoRow
                      label={t("group-channel")}
                      value={familyState.groupChannel}
                    />
                  </Grid>
                )}
                {familyState.groupLink && (
                  <Grid size={{ xs: 12 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {t("group-link")}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        href={familyState.groupLink}
                        target="_blank"
                        startIcon={<Iconify icon="solar:link-bold" />}
                      >
                        {t("open-group")}
                      </Button>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        )}

        <Divider />

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            mb={1}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {t("members-title")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("member-count", { count: members.length })}
            </Typography>
          </Stack>
          {members.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("no-members")}
            </Typography>
          ) : (
            <List disablePadding>
              {members.map((member) => (
                <ListItem
                  key={member.registrationId}
                  alignItems="flex-start"
                  disableGutters
                >
                  <ListItemAvatar>
                    <Avatar>{initialsFromName(member.name)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={
                            member.gender === "Male" ? t("male") : t("female")
                          }
                          size="small"
                          color={
                            member.gender === "Male" ? "info" : "secondary"
                          }
                          variant="outlined"
                        />
                        {member.city && (
                          <Typography variant="caption" color="text.secondary">
                            {member.city}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider />

        <Stack direction="row" justifyContent="flex-end" spacing={2} mb={2}>
          <Button
            variant="outlined"
            onClick={() => onClose?.()}
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
          >
            {t("close")}
          </Button>
          {canEdit && (
            <Stack direction="row" spacing={1}>
              {isEditing && (
                <Button
                  variant="outlined"
                  onClick={handleToggleEdit}
                  startIcon={<Iconify icon="solar:close-circle-bold" />}
                  disabled={isSaving}
                >
                  {t("cancel-edit")}
                </Button>
              )}
              <Button
                variant="contained"
                color={isEditing ? "info" : "primary"}
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    handleToggleEdit();
                  }
                }}
                startIcon={
                  isSaving ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : isEditing ? (
                    <Iconify icon="solar:diskette-bold" />
                  ) : (
                    <Iconify icon="solar:pen-bold" />
                  )
                }
                disabled={isSaving || !formValues.name?.trim()}
              >
                {isEditing ? t("save") : t("edit")}
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  );
}
