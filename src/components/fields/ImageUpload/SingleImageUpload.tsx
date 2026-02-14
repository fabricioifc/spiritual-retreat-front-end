'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Accept, useDropzone } from 'react-dropzone';

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import ZoomOutMapRoundedIcon from '@mui/icons-material/ZoomOutMapRounded';
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

export interface ExistingImage {
  id?: string | number;
  url: string;
  title?: string;
}

export interface SingleImageUploadProps {
  label?: string;
  value?: File | null; // controlado opcional
  onChange?: (file: File | null) => void;
  existing?: ExistingImage; // imagem já salva (URL)
  onRemoveExisting?: (id: string | number, image: ExistingImage) => void;
  accept?: Accept;
  maxSizeMB?: number;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  variant?: 'standard' | 'avatar'; // tipo de visualização
  size?: number; // tamanho para variant avatar
}

export default function SingleImageUpload({
  label = 'Adicionar imagem',
  value,
  onChange,
  existing,
  onRemoveExisting,
  accept = { 'image/*': [] },
  maxSizeMB = 5,
  disabled,
  errorText,
  helperText,
  variant = 'standard',
  size = 120,
}: SingleImageUploadProps) {
  const [file, setFile] = useState<File | null>(value ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Sync externo
  useEffect(() => {
    setFile(value ?? null);
  }, [value]);

  // Gera preview e evita vazamento de memória
  useEffect(() => {
    // limpa anterior
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [file]);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      // valida tamanho
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        return; // poderia mostrar erro aqui
      }

      setFile(selectedFile);
      onChange?.(selectedFile);
    },
    [maxSizeMB, onChange]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted?.length) return;
      handleFileSelect(accepted[0]); // apenas o primeiro arquivo
    },
    [handleFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    noClick: true, // usamos botão para abrir
    disabled,
  });

  const handleRemove = () => {
    setFile(null);
    onChange?.(null);
  };

  const handleRemoveExisting = () => {
    if (existing && onRemoveExisting && existing.id != null) {
      onRemoveExisting(existing.id, existing);
    }
  };

  const currentImageUrl = previewUrl || existing?.url;
  const hasImage = Boolean(currentImageUrl);

  // Variant Avatar
  if (variant === 'avatar') {
    return (
      <Stack spacing={1.25} alignItems="center">
        <Typography variant="subtitle2">{label}</Typography>

        {helperText && !errorText && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: -0.5 }}
          >
            {helperText}
          </Typography>
        )}

        <Box
          {...getRootProps()}
          sx={{
            position: 'relative',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <input {...getInputProps()} />
          <Avatar
            src={currentImageUrl || undefined}
            sx={{
              width: size,
              height: size,
              border: '2px dashed',
              borderColor: errorText
                ? 'error.main'
                : isDragActive
                  ? 'primary.main'
                  : 'divider',
              bgcolor: (theme) =>
                isDragActive
                  ? theme.vars?.palette.action.hover
                  : theme.vars?.palette.background.default,
              transition: 'all .15s ease',
            }}
          >
            {!hasImage && <ImageRoundedIcon sx={{ fontSize: size * 0.4 }} />}
          </Avatar>

          {hasImage && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {currentImageUrl && (
                <Tooltip title="Abrir">
                  <IconButton
                    size="small"
                    component="a"
                    href={currentImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                  >
                    <ZoomOutMapRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Remover">
                <IconButton
                  size="small"
                  onClick={previewUrl ? handleRemove : handleRemoveExisting}
                  sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadRoundedIcon />}
            onClick={open}
            disabled={disabled}
          >
            {hasImage ? 'Alterar' : 'Selecionar'}
          </Button>
          {hasImage && (
            <Button
              size="small"
              variant="text"
              color="error"
              onClick={previewUrl ? handleRemove : handleRemoveExisting}
              disabled={disabled}
            >
              Remover
            </Button>
          )}
        </Stack>

        {helperText && !errorText && (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            {helperText}
          </Typography>
        )}

        {errorText && (
          <Typography variant="caption" color="error" textAlign="center">
            {errorText}
          </Typography>
        )}
      </Stack>
    );
  }

  // Variant Standard
  return (
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="subtitle2">{label}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadRoundedIcon />}
            onClick={open}
            disabled={disabled}
          >
            {hasImage ? 'Alterar' : 'Selecionar'}
          </Button>
          {hasImage && (
            <Tooltip title="Remover">
              <span>
                <IconButton
                  size="small"
                  onClick={previewUrl ? handleRemove : handleRemoveExisting}
                  disabled={disabled}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {helperText && !errorText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
          {helperText}
        </Typography>
      )}

      <Box
        {...getRootProps()}
        sx={{
          p: 2,
          border: '1px dashed',
          borderColor: errorText
            ? 'error.main'
            : isDragActive
              ? 'primary.main'
              : 'divider',
          bgcolor: (theme) =>
            isDragActive
              ? theme.vars?.palette.action.hover
              : theme.vars?.palette.background.default,
          borderRadius: 2,
          outline: 'none',
          transition: 'all .15s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: hasImage ? 'auto' : 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input {...getInputProps()} />

        {hasImage ? (
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <img
              src={currentImageUrl}
              alt={file?.name || existing?.title || 'Imagem'}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: 200,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {currentImageUrl && (
                <Tooltip title="Abrir">
                  <IconButton
                    size="small"
                    component="a"
                    href={currentImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                    }}
                  >
                    <ZoomOutMapRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {file && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {file.name} • {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            )}
          </Box>
        ) : (
          <Stack spacing={1} alignItems="center">
            <ImageRoundedIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Arraste e solte uma imagem aqui ou clique em
              &quot;Selecionar&quot;.
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              PNG/JPG até {maxSizeMB}MB
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip size="small" label="image/png" />
              <Chip size="small" label="image/jpeg" />
            </Stack>
          </Stack>
        )}
      </Box>

      {errorText && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {errorText}
        </Typography>
      )}
    </Stack>
  );
}
