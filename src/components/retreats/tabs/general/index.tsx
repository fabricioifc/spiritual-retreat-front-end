"use client";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Skeleton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMenuMode } from "@/src/contexts/users-context/MenuModeContext";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBreadCrumbs } from "@/src/contexts/BreadCrumbsContext";
import { useModal } from "@/src/hooks/useModal";
import { useSnackbar } from "notistack";
import TextFieldMasked from "@/src/components/fields/maskedTextFields/TextFieldMasked";
import DeleteConfirmation from "@/src/components/confirmations/DeleteConfirmation";
import { Retreat } from "@/src/types/retreats";
import {
  fetchRetreatData,
  createRetreat,
  updateRetreat,
  deleteRetreat,
  deleteRetreatImage,
  reorderRetreatImages,
  uploadRetreatImage,
} from "@/src/components/retreats/shared";
import SingleImageUpload from "@/src/components/fields/ImageUpload/SingleImageUpload";
import SortableMultiImageUpload, {
  SortableGalleryImageItem,
} from "@/src/components/fields/ImageUpload/SortableMultiImageUpload";

const retreatGeneralSchema = z
  .object({
    name: z.string().trim().min(1, "O título é obrigatório"),
    edition: z.string().trim().min(1, "Informe a edição"),
    theme: z.string().trim().min(1, "Informe o tema"),
    shortDescription: z.string().optional(),
    longDescription: z.string().optional(),
    startDate: z.string().min(1, "Informe a data de início"),
    endDate: z.string().min(1, "Informe a data de fim"),
    registrationStart: z.string().min(1, "Informe o início das inscrições"),
    registrationEnd: z.string().min(1, "Informe o fim das inscrições"),
    feeFazer: z.number().min(0, "Informe um valor válido"),
    feeServir: z.number().min(0, "Informe um valor válido"),
    maleSlots: z.number().min(0, "Vagas masculinas devem ser positivas"),
    femaleSlots: z.number().min(0, "Vagas femininas devem ser positivas"),
    westRegionPct: z
      .number()
      .min(0)
      .max(100, "Percentual deve estar entre 0 e 100"),
    otherRegionPct: z
      .number()
      .min(0)
      .max(100, "Percentual deve estar entre 0 e 100"),
    stateShort: z.string().optional(),
    city: z.string().optional(),
    location: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    instructor: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.registrationStart &&
      data.registrationEnd &&
      data.registrationEnd < data.registrationStart
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationEnd"],
        message: "A data final deve ser posterior à inicial",
      });
    }

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "A data final deve ser posterior à inicial",
      });
    }
  });

type RetreatGeneralFormValues = z.output<typeof retreatGeneralSchema>;

const defaultFormValues: RetreatGeneralFormValues = {
  name: "",
  edition: "1",
  theme: "",
  shortDescription: "",
  longDescription: "",
  startDate: "",
  endDate: "",
  registrationStart: "",
  registrationEnd: "",
  feeFazer: 0,
  feeServir: 0,
  maleSlots: 60,
  femaleSlots: 60,
  westRegionPct: 85,
  otherRegionPct: 15,
  stateShort: "",
  city: "",
  location: "",
  contactEmail: "",
  contactPhone: "",
  instructor: "",
};

const normalizeDateInput = (value?: string | null): string => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const extractNumericValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === "object") {
    const amount = (value as { amount?: number }).amount;
    if (typeof amount === "number" && Number.isFinite(amount)) {
      return amount;
    }

    const nestedValue = (value as { value?: number }).value;
    if (typeof nestedValue === "number" && Number.isFinite(nestedValue)) {
      return nestedValue;
    }
  }

  return 0;
};

const mapRetreatToFormValues = (
  retreat: Retreat
): RetreatGeneralFormValues => ({
  ...defaultFormValues,
  name: retreat.name ?? defaultFormValues.name,
  edition:
    retreat.edition != null
      ? String(retreat.edition)
      : defaultFormValues.edition,
  theme: retreat.theme ?? defaultFormValues.theme,
  shortDescription:
    retreat.shortDescription ?? defaultFormValues.shortDescription,
  longDescription: retreat.longDescription ?? defaultFormValues.longDescription,
  startDate: normalizeDateInput(retreat.startDate),
  endDate: normalizeDateInput(retreat.endDate),
  registrationStart: normalizeDateInput(retreat.registrationStart),
  registrationEnd: normalizeDateInput(retreat.registrationEnd),
  feeFazer:
    typeof retreat.feeFazerAmount === "number"
      ? retreat.feeFazerAmount
      : extractNumericValue(retreat.feeFazer),
  feeServir:
    typeof retreat.feeServirAmount === "number"
      ? retreat.feeServirAmount
      : extractNumericValue(retreat.feeServir),
  maleSlots:
    typeof retreat.maleSlots === "number"
      ? retreat.maleSlots
      : defaultFormValues.maleSlots,
  femaleSlots:
    typeof retreat.femaleSlots === "number"
      ? retreat.femaleSlots
      : defaultFormValues.femaleSlots,
  westRegionPct: extractNumericValue(retreat.westRegionPct),
  otherRegionPct: extractNumericValue(retreat.otherRegionPct),
  stateShort: retreat.stateShort ?? defaultFormValues.stateShort,
  city: retreat.city ?? defaultFormValues.city,
  location: retreat.location ?? defaultFormValues.location,
  contactEmail: retreat.contactEmail ?? defaultFormValues.contactEmail,
  contactPhone: retreat.contactPhone ?? defaultFormValues.contactPhone,
  instructor: retreat.instructor ?? defaultFormValues.instructor,
});

type RetreatImagePayload = string | {
  storageId?: string;
  storageKey?: string;
  id?: string | number;
  imageUrl?: string;
  url?: string;
  type?: string;
  order?: number;
  title?: string;
  altText?: string;
};

type ExistingServerImage = {
  id: string;
  storageId?: string;
  url: string;
  title?: string;
};

const normalizeServerImageType = (type?: string): "Banner" | "Thumbnail" | "Gallery" => {
  const normalized = (type ?? "").toLowerCase();
  if (normalized === "banner") return "Banner";
  if (normalized === "thumbnail") return "Thumbnail";
  return "Gallery";
};

const parseRetreatImages = (
  rawImages: RetreatImagePayload[] | undefined
): {
  banner: ExistingServerImage | null;
  thumbnail: ExistingServerImage | null;
  gallery: SortableGalleryImageItem[];
} => {
  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    return { banner: null, thumbnail: null, gallery: [] };
  }

  let banner: ExistingServerImage | null = null;
  let thumbnail: ExistingServerImage | null = null;
  const gallery: SortableGalleryImageItem[] = [];

  const mapped = rawImages
    .map((raw, index) => {
      if (typeof raw === "string") {
        return {
          id: `legacy-${index}`,
          storageId: undefined,
          url: raw,
          title: undefined,
          type: "Gallery" as const,
          order: index,
        };
      }

      const url = raw.imageUrl ?? raw.url;
      if (!url) return null;
      const storageIdRaw = raw.storageId ?? raw.storageKey ?? raw.id;
      const storageId =
        storageIdRaw != null ? String(storageIdRaw) : undefined;
      return {
        id: storageId ?? `legacy-${index}`,
        storageId,
        url,
        title: raw.title ?? raw.altText,
        type: normalizeServerImageType(raw.type),
        order: typeof raw.order === "number" ? raw.order : index,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  for (const image of mapped) {
    if (image.type === "Banner" && !banner) {
      banner = {
        id: image.id,
        storageId: image.storageId,
        url: image.url,
        title: image.title,
      };
      continue;
    }
    if (image.type === "Thumbnail" && !thumbnail) {
      thumbnail = {
        id: image.id,
        storageId: image.storageId,
        url: image.url,
        title: image.title,
      };
      continue;
    }

    gallery.push({
      id: `gallery-${image.id}`,
      source: "server",
      storageId: image.storageId,
      url: image.url,
      title: image.title,
    });
  }

  gallery.sort((a, b) => {
    const aOrder = mapped.find((item) => `gallery-${item.id}` === a.id)?.order ?? 0;
    const bOrder = mapped.find((item) => `gallery-${item.id}` === b.id)?.order ?? 0;
    return aOrder - bOrder;
  });

  return { banner, thumbnail, gallery };
};

const RetreatEditPage = ({
  isCreating,
  initialData,
}: {
  isCreating?: boolean;
  initialData?: Retreat;
}) => {
  const { menuMode } = useMenuMode();
  const { setBreadCrumbsTitle } = useBreadCrumbs();
  const router = useRouter();
  const params = useParams();
  const modal = useModal();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const rawId = params?.id;
  const retreatId =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : undefined;

  const { data: retreatData, isLoading } = useQuery({
    queryKey: ["retreats", retreatId ?? "new"],
    queryFn: () => fetchRetreatData(retreatId!),
    enabled: Boolean(retreatId) && !isCreating,
    initialData,
    staleTime: 5 * 60 * 1000,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RetreatGeneralFormValues>({
    resolver: zodResolver(retreatGeneralSchema),
    defaultValues: defaultFormValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [existingBanner, setExistingBanner] = useState<ExistingServerImage | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<ExistingServerImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<SortableGalleryImageItem[]>([]);
  const [deletedServerImageIds, setDeletedServerImageIds] = useState<string[]>([]);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  const isReadOnly = menuMode === "view";

  useEffect(() => {
    if (retreatData) {
      reset(mapRetreatToFormValues(retreatData));
      const parsedImages = parseRetreatImages(retreatData.images);
      setExistingBanner(parsedImages.banner);
      setExistingThumbnail(parsedImages.thumbnail);
      setGalleryImages(parsedImages.gallery);
      setDeletedServerImageIds([]);
      setBannerFile(null);
      setThumbnailFile(null);
    } else if (isCreating) {
      reset(defaultFormValues);
      setExistingBanner(null);
      setExistingThumbnail(null);
      setGalleryImages([]);
      setDeletedServerImageIds([]);
      setBannerFile(null);
      setThumbnailFile(null);
    }
  }, [retreatData, isCreating, reset]);

  useEffect(() => {
    if (retreatData) {
      setBreadCrumbsTitle({
        title: retreatData.name,
        pathname: `/retreats/${retreatData.id}`,
      });
    } else if (isCreating) {
      setBreadCrumbsTitle({
        title: "Criar Retiro",
        pathname: "/retreats/create",
      });
    }
  }, [retreatData, isCreating, setBreadCrumbsTitle]);

  const watchedName = watch("name");

  const handleDelete = () => {
    if (!retreatData?.id) return;

    modal.open({
      title: "Confirmar exclusão",
      size: "sm",
      customRender: () => (
        <DeleteConfirmation
          title="Excluir Retiro"
          resourceName={retreatData.name}
          description="Esta ação não pode ser desfeita e removerá permanentemente o retiro."
          requireCheckboxLabel="Eu entendo as consequências."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={async () => {
            try {
              await deleteRetreat(String(retreatData.id));

              enqueueSnackbar("Retiro excluído com sucesso!", {
                variant: "success",
              });

              modal.close();
              router.push("/retreats");
            } catch (error: unknown) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Erro ao excluir retiro. Tente novamente.";
              enqueueSnackbar(message, {
                variant: "error",
              });
              throw error;
            }
          }}
          onCancel={() => modal.close()}
        />
      ),
    });
  };

  const addDeletedServerImageId = (storageId?: string) => {
    if (!storageId) return;
    setDeletedServerImageIds((prev) =>
      prev.includes(storageId) ? prev : [...prev, storageId]
    );
  };

  const syncRetreatImagesBatch = async (targetRetreatId: string) => {
    const uniqueDeletedStorageIds = [...new Set(deletedServerImageIds)];

    if (uniqueDeletedStorageIds.length > 0) {
      setSavingStatus("removendo imagens");
      await Promise.all(
        uniqueDeletedStorageIds.map((storageId) =>
          deleteRetreatImage(targetRetreatId, storageId)
        )
      );
    }

    const uploadedGalleryItems = new Map<string, string>();

    if (bannerFile) {
      setSavingStatus("enviando banner");
      await uploadRetreatImage(targetRetreatId, {
        file: bannerFile,
        type: "Banner",
        order: 0,
      });
    }

    if (thumbnailFile) {
      setSavingStatus("enviando thumbnail");
      await uploadRetreatImage(targetRetreatId, {
        file: thumbnailFile,
        type: "Thumbnail",
        order: 0,
      });
    }

    const galleryCount = galleryImages.length;
    const totalLocalGalleryImages = galleryImages.filter(
      (image) => image.source === "local"
    ).length;
    let uploadedLocalImages = 0;

    for (let index = 0; index < galleryCount; index += 1) {
      const image = galleryImages[index];
      if (image.source !== "local") continue;

      uploadedLocalImages += 1;
      setSavingStatus(
        `enviando galeria (${uploadedLocalImages}/${totalLocalGalleryImages})`
      );

      const uploadResult = await uploadRetreatImage(targetRetreatId, {
        file: image.file,
        type: "Gallery",
        order: index,
        altText: image.title,
      });

      uploadedGalleryItems.set(image.id, uploadResult.storageKey);
    }

    const hasServerImageWithoutStorageId = galleryImages.some(
      (image) => image.source === "server" && !image.storageId
    );

    if (hasServerImageWithoutStorageId) {
      return;
    }

    const imageOrders = galleryImages
      .map((image, index) => {
        if (image.source === "server") {
          return image.storageId
            ? { storageId: image.storageId, newOrder: index }
            : null;
        }
        const storageId = uploadedGalleryItems.get(image.id);
        return storageId ? { storageId, newOrder: index } : null;
      })
      .filter(
        (item): item is { storageId: string; newOrder: number } => item != null
      );

    if (imageOrders.length > 0) {
      setSavingStatus("reordenando galeria");
      await reorderRetreatImages(targetRetreatId, imageOrders);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      ...values,
    };

    // Salva os valores anteriores em caso de erro
    const previousFormValues = { ...values };
    const previousDeletedServerImageIds = [...deletedServerImageIds];
    const previousGalleryImages = [...galleryImages];
    const previousBannerFile = bannerFile;
    const previousThumbnailFile = thumbnailFile;
    const previousExistingBanner = existingBanner;
    const previousExistingThumbnail = existingThumbnail;

    try {
      let currentRetreatId: string | undefined;
      setSavingStatus("salvando dados");

      if (isCreating) {
        const data = await createRetreat(payload);
        currentRetreatId = data.retreatId;
        await syncRetreatImagesBatch(currentRetreatId);
        enqueueSnackbar("Retiro criado com sucesso!", {
          variant: "success",
        });
        setDeletedServerImageIds([]);
        setBannerFile(null);
        setThumbnailFile(null);
        router.push(`/retreats/${currentRetreatId}`);
        return;
      }

      const idToUpdate =
        retreatId ?? (retreatData ? String(retreatData.id) : undefined);
      if (!idToUpdate) {
        throw new Error("ID do retiro não encontrado");
      }
      currentRetreatId = idToUpdate;

      await updateRetreat(idToUpdate, payload);
      await syncRetreatImagesBatch(currentRetreatId);

      // Invalida a query para refetch dos dados atualizados
      await queryClient.invalidateQueries({
        queryKey: ["retreats", currentRetreatId],
      });

      setDeletedServerImageIds([]);
      setBannerFile(null);
      setThumbnailFile(null);
      enqueueSnackbar("Retiro atualizado com sucesso!", {
        variant: "success",
      });
    } catch (error: unknown) {
      // Em caso de erro, reseta para os valores anteriores
      reset(previousFormValues);
      setDeletedServerImageIds(previousDeletedServerImageIds);
      setGalleryImages(previousGalleryImages);
      setBannerFile(previousBannerFile);
      setThumbnailFile(previousThumbnailFile);
      setExistingBanner(previousExistingBanner);
      setExistingThumbnail(previousExistingThumbnail);

      const message =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro. Tente novamente.";
      enqueueSnackbar(message, {
        variant: "error",
      });
    } finally {
      setSavingStatus(null);
    }
  });

  if (!isCreating && isLoading) {
    return (
      <Box sx={{ width: "100%", height: "100%", p: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="circular" width={200} height={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[...Array(5)].map((_, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Skeleton variant="rectangular" height={56} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isCreating
          ? "Criar Retiro"
          : `Editar Retiro: ${watchedName || retreatData?.name || ""}`}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Título"
            required
            disabled={isReadOnly}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register("name")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Edição"
            required
            disabled={isReadOnly}
            error={Boolean(errors.edition)}
            helperText={errors.edition?.message}
            {...register("edition")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Tema"
            required
            disabled={isReadOnly}
            error={Boolean(errors.theme)}
            helperText={errors.theme?.message}
            {...register("theme")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Localização"
            disabled={isReadOnly}
            error={Boolean(errors.location)}
            helperText={errors.location?.message}
            {...register("location")}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Descrição curta"
            multiline
            minRows={2}
            disabled={isReadOnly}
            error={Boolean(errors.shortDescription)}
            helperText={errors.shortDescription?.message}
            {...register("shortDescription")}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Descrição longa"
            multiline
            minRows={4}
            disabled={isReadOnly}
            error={Boolean(errors.longDescription)}
            helperText={errors.longDescription?.message}
            {...register("longDescription")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="E-mail de contato"
            type="email"
            disabled={isReadOnly}
            error={Boolean(errors.contactEmail)}
            helperText={errors.contactEmail?.message}
            {...register("contactEmail")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            control={control}
            name="contactPhone"
            render={({ field }) => (
              <TextFieldMasked
                maskType="phone"
                fullWidth
                label="Telefone de contato"
                disabled={isReadOnly}
                error={Boolean(errors.contactPhone)}
                helperText={errors.contactPhone?.message}
                value={field.value ?? ""}
                name={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </Grid>

        {/* <Grid size={{ xs: 12 }}>
          <LocationField
            selectedState={watchedState ?? ""}
            selectedCity={watchedCity ?? ""}
            onStateChange={handleStateChange}
            onCityChange={handleCityChange}
            size="medium"
            disabled={isReadOnly && !isCreating}
            error={Boolean(errors.stateShort?.message || errors.city?.message)}
            helperText={errors.stateShort?.message ?? errors.city?.message}
          />
        </Grid> */}

        {/* <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Descrição"
            multiline
            minRows={3}
            disabled={isReadOnly}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
            {...register("description")}
          />
        </Grid> */}

        <Grid size={{ xs: 12, md: 6 }}>
          <SingleImageUpload
            label="Banner"
            value={bannerFile}
            existing={
              existingBanner
                ? {
                    id: existingBanner.id,
                    url: existingBanner.url,
                    title: existingBanner.title,
                  }
                : undefined
            }
            onChange={setBannerFile}
            onRemoveExisting={(id) => {
              addDeletedServerImageId(existingBanner?.storageId ?? String(id));
              setExistingBanner(null);
            }}
            maxSizeMB={5}
            disabled={isReadOnly}
            helperText="JPG/PNG até 5MB. Substitui automaticamente no servidor."
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SingleImageUpload
            label="Thumbnail"
            value={thumbnailFile}
            existing={
              existingThumbnail
                ? {
                    id: existingThumbnail.id,
                    url: existingThumbnail.url,
                    title: existingThumbnail.title,
                  }
                : undefined
            }
            onChange={setThumbnailFile}
            onRemoveExisting={(id) => {
              addDeletedServerImageId(existingThumbnail?.storageId ?? String(id));
              setExistingThumbnail(null);
            }}
            maxSizeMB={5}
            disabled={isReadOnly}
            helperText="JPG/PNG até 5MB. Substitui automaticamente no servidor."
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <SortableMultiImageUpload
            label="Galeria de imagens"
            value={galleryImages}
            onChange={setGalleryImages}
            onRemoveServerImage={(image) => {
              addDeletedServerImageId(image.storageId);
            }}
            maxFiles={20}
            maxSizeMB={5}
            disabled={isReadOnly}
            helperText="Você pode ordenar antes de salvar. O envio é feito em lote ao clicar em salvar."
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Data de Início das Inscrições"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            disabled={isReadOnly}
            error={Boolean(errors.registrationStart)}
            helperText={errors.registrationStart?.message}
            {...register("registrationStart")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Data de Fim das Inscrições"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            disabled={isReadOnly}
            error={Boolean(errors.registrationEnd)}
            helperText={errors.registrationEnd?.message}
            {...register("registrationEnd")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Data de Início"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            disabled={isReadOnly}
            error={Boolean(errors.startDate)}
            helperText={errors.startDate?.message}
            {...register("startDate")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Data de Fim"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            disabled={isReadOnly}
            error={Boolean(errors.endDate)}
            helperText={errors.endDate?.message}
            {...register("endDate")}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Vagas Masculinas"
            type="number"
            disabled={isReadOnly}
            error={Boolean(errors.maleSlots)}
            helperText={errors.maleSlots?.message}
            inputProps={{ min: 0 }}
            {...register("maleSlots", {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === "" || value == null ? 0 : Number(value),
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Vagas Femininas"
            type="number"
            disabled={isReadOnly}
            error={Boolean(errors.femaleSlots)}
            helperText={errors.femaleSlots?.message}
            inputProps={{ min: 0 }}
            {...register("femaleSlots", {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === "" || value == null ? 0 : Number(value),
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="% Região Oeste"
            type="number"
            disabled={isReadOnly}
            error={Boolean(errors.westRegionPct)}
            helperText={errors.westRegionPct?.message}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            {...register("westRegionPct", {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === "" || value == null ? 85 : Number(value),
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="% Outras Regiões"
            type="number"
            disabled={isReadOnly}
            error={Boolean(errors.otherRegionPct)}
            helperText={errors.otherRegionPct?.message}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            {...register("otherRegionPct", {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === "" || value == null ? 15 : Number(value),
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            control={control}
            name="feeFazer"
            render={({ field }) => (
              <TextFieldMasked
                maskType="currency"
                fullWidth
                label="Taxa de Participação"
                disabled={isReadOnly}
                error={Boolean(errors.feeFazer)}
                helperText={errors.feeFazer?.message}
                value={field.value ?? 0}
                name={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const numericValue = Number(event.target.value || 0);
                  field.onChange(Number.isNaN(numericValue) ? 0 : numericValue);
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            control={control}
            name="feeServir"
            render={({ field }) => (
              <TextFieldMasked
                maskType="currency"
                fullWidth
                label="Taxa de Servidão"
                disabled={isReadOnly}
                error={Boolean(errors.feeServir)}
                helperText={errors.feeServir?.message}
                value={field.value ?? 0}
                name={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const numericValue = Number(event.target.value || 0);
                  field.onChange(Number.isNaN(numericValue) ? 0 : numericValue);
                }}
              />
            )}
          />
        </Grid>

        {/* <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Instrutor"
            disabled={isReadOnly}
            error={Boolean(errors.instructor)}
            helperText={errors.instructor?.message}
            {...register("instructor")}
          />
        </Grid> */}

        <Grid
          size={{ xs: 12 }}
          sx={{
            position: "sticky",
            bottom: 0,
          }}
        >
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            {!isCreating && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                  disabled={isSubmitting || isReadOnly}
                >
                  Excluir Retiro
                </Button>
                <Button
                  variant="outlined"
                  type="button"
                  onClick={() => {
                    if (retreatData) {
                      reset(mapRetreatToFormValues(retreatData));
                      const parsedImages = parseRetreatImages(retreatData.images);
                      setExistingBanner(parsedImages.banner);
                      setExistingThumbnail(parsedImages.thumbnail);
                      setGalleryImages(parsedImages.gallery);
                    } else {
                      reset(defaultFormValues);
                      setExistingBanner(null);
                      setExistingThumbnail(null);
                      setGalleryImages([]);
                    }
                    setDeletedServerImageIds([]);
                    setBannerFile(null);
                    setThumbnailFile(null);
                  }}
                  disabled={isSubmitting || isReadOnly}
                >
                  Cancelar
                </Button>
              </>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || isReadOnly}
            >
              {isSubmitting
                ? `Salvando${savingStatus ? ` (${savingStatus})` : ""}...`
                : isCreating
                  ? "Salvar Retiro"
                  : "Salvar Alterações"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RetreatEditPage;
