"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ZoomOutMapRoundedIcon from "@mui/icons-material/ZoomOutMapRounded";
import { Accept, useDropzone } from "react-dropzone";

export type SortableGalleryImageItem =
  | {
      id: string;
      source: "server";
      storageId?: string;
      url: string;
      title?: string;
    }
  | {
      id: string;
      source: "local";
      file: File;
      title?: string;
    };

export interface SortableMultiImageUploadProps {
  label?: string;
  value: SortableGalleryImageItem[];
  onChange: (value: SortableGalleryImageItem[]) => void;
  onRemoveServerImage?: (item: Extract<SortableGalleryImageItem, { source: "server" }>) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: Accept;
  cols?: number;
  rowHeight?: number;
  helperText?: string;
  errorText?: string;
}

const getFileKey = (file: File): string =>
  `${file.name}-${file.size}-${file.lastModified}`;

const createLocalId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

export default function SortableMultiImageUpload({
  label = "Galeria",
  value,
  onChange,
  onRemoveServerImage,
  disabled,
  maxFiles = 20,
  maxSizeMB = 5,
  accept = { "image/*": [] },
  cols = 4,
  rowHeight = 140,
  helperText,
  errorText,
}: SortableMultiImageUploadProps) {
  const objectUrlsRef = useRef<Map<string, string>>(new Map());
  const [localPreviewUrls, setLocalPreviewUrls] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const localItems = value.filter(
      (item): item is Extract<SortableGalleryImageItem, { source: "local" }> =>
        item.source === "local"
    );

    const activeIds = new Set(localItems.map((item) => item.id));
    objectUrlsRef.current.forEach((url, id) => {
      if (!activeIds.has(id)) {
        URL.revokeObjectURL(url);
        objectUrlsRef.current.delete(id);
      }
    });

    for (const item of localItems) {
      if (!objectUrlsRef.current.has(item.id)) {
        objectUrlsRef.current.set(item.id, URL.createObjectURL(item.file));
      }
    }

    const nextPreviewUrls: Record<string, string> = {};
    for (const item of localItems) {
      const previewUrl = objectUrlsRef.current.get(item.id);
      if (previewUrl) {
        nextPreviewUrls[item.id] = previewUrl;
      }
    }
    setLocalPreviewUrls(nextPreviewUrls);
  }, [value]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
      setLocalPreviewUrls({});
    };
  }, []);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
      if (!valid.length) return;

      const existingLocalKeys = new Set(
        value
          .filter(
            (item): item is Extract<SortableGalleryImageItem, { source: "local" }> =>
              item.source === "local"
          )
          .map((item) => getFileKey(item.file))
      );

      const deduped = valid.filter((file) => !existingLocalKeys.has(getFileKey(file)));
      if (!deduped.length) return;

      const next = [
        ...value,
        ...deduped.map<SortableGalleryImageItem>((file) => ({
          id: createLocalId(),
          source: "local",
          file,
          title: file.name,
        })),
      ].slice(0, maxFiles);

      onChange(next);
    },
    [maxFiles, maxSizeMB, onChange, value]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      addFiles(accepted);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    multiple: true,
    maxFiles,
    noClick: true,
    disabled,
  });

  const handleRemove = (item: SortableGalleryImageItem) => {
    if (item.source === "server") {
      onRemoveServerImage?.(item);
    }
    onChange(value.filter((current) => current.id !== item.id));
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    onChange(moveItem(value, fromIndex, toIndex));
  };

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">{label}</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<UploadRoundedIcon />}
          onClick={open}
          disabled={disabled}
        >
          Selecionar
        </Button>
      </Stack>

      {helperText && !errorText && (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}

      <Box
        {...getRootProps()}
        sx={{
          p: 2,
          border: "1px dashed",
          borderColor: errorText
            ? "error.main"
            : isDragActive
              ? "primary.main"
              : "divider",
          bgcolor: (theme) =>
            isDragActive
              ? theme.vars?.palette.action.hover
              : theme.vars?.palette.background.default,
          borderRadius: 2,
          outline: "none",
          transition: "all .15s ease",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <input {...getInputProps()} />
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Arraste e solte imagens aqui ou clique em &quot;Selecionar&quot;.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            PNG/JPG até {maxSizeMB}MB • Máx {maxFiles} imagens
          </Typography>
          {value.length === 0 && (
            <Stack direction="row" spacing={1}>
              <Chip size="small" label="image/png" />
              <Chip size="small" label="image/jpeg" />
              <Chip size="small" label="image/webp" />
            </Stack>
          )}
        </Stack>
      </Box>

      {errorText && (
        <Typography variant="caption" color="error">
          {errorText}
        </Typography>
      )}

      {value.length > 0 && (
        <ImageList cols={cols} rowHeight={rowHeight} gap={8} sx={{ m: 0 }}>
          {value.map((item, index) => {
            const previewUrl =
              item.source === "server"
                ? item.url
                : localPreviewUrls[item.id] ?? null;
            const isFirst = index === 0;
            const isLast = index === value.length - 1;

            return (
              <ImageListItem key={item.id}>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={item.title ?? `Imagem ${index + 1}`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      minHeight: rowHeight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="caption">Carregando preview...</Typography>
                  </Box>
                )}
                <ImageListItemBar
                  title={item.title ?? ""}
                  subtitle={`Ordem: ${index + 1}`}
                  actionIcon={
                    <Stack direction="row" alignItems="center" sx={{ mr: 0.5 }}>
                      <Tooltip title="Mover para cima">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleMove(index, index - 1)}
                            disabled={disabled || isFirst}
                            sx={{ color: "white" }}
                          >
                            <ArrowUpwardRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Mover para baixo">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleMove(index, index + 1)}
                            disabled={disabled || isLast}
                            sx={{ color: "white" }}
                          >
                            <ArrowDownwardRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {previewUrl && (
                        <Tooltip title="Abrir">
                          <IconButton
                            size="small"
                            component="a"
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{ color: "white" }}
                          >
                            <ZoomOutMapRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Remover">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(item)}
                            disabled={disabled}
                            sx={{ color: "white" }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  }
                  position="top"
                  sx={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 100%)",
                  }}
                />
              </ImageListItem>
            );
          })}
        </ImageList>
      )}
    </Stack>
  );
}
