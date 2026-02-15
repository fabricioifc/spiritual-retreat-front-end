'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { useSnackbar } from 'notistack';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import ZoomOutMapRoundedIcon from '@mui/icons-material/ZoomOutMapRounded';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import api from '@/src/lib/axiosClientInstance';

const MAX_SIZE_MB = 5;

export type ProfilePictureModalProps = {
  userId: string | number;
  userName?: string | null;
  currentImage?: string | null;
  useMeRoutes?: boolean;
  onClose: VoidFunction;
  onUploadSuccess: (nextUrl: string | null) => Promise<void> | void;
};

type UploadResponse = {
  profile_picture?: string;
  profilePicture?: string;
  photoUrl?: string;
  url?: string;
  message?: string;
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

const getFallbackInitial = (name?: string | null) => {
  if (!name) return '';
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback;

  const maybeResponse = (
    error as { response?: { data?: ApiErrorPayload | string } }
  ).response;
  const payload = maybeResponse?.data;

  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    if (payload.error?.trim()) return payload.error;
    if (payload.message?.trim()) return payload.message;
  }

  const maybeMessage = (error as { message?: string }).message;
  if (maybeMessage?.trim()) return maybeMessage;

  return fallback;
};

const getUploadedPhotoUrl = (response: UploadResponse | null) => {
  if (!response) return null;
  return (
    response.photoUrl ??
    response.profile_picture ??
    response.profilePicture ??
    response.url ??
    null
  );
};

export function ProfilePictureModal({
  userId,
  userName,
  currentImage,
  useMeRoutes = false,
  onClose,
  onUploadSuccess,
}: ProfilePictureModalProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const initials = useMemo(() => getFallbackInitial(userName), [userName]);

  const resetObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImage ?? null
  );

  useEffect(() => {
    setPreviewUrl(currentImage ?? null);
  }, [currentImage]);

  useEffect(() => {
    return () => {
      resetObjectUrl();
    };
  }, []);

  const selectFile = useCallback(
    (selectedFile: File) => {
      if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
        const message = `A imagem deve ter no máximo ${MAX_SIZE_MB}MB.`;
        setErrorText(message);
        enqueueSnackbar(message, { variant: 'warning' });
        return;
      }

      resetObjectUrl();

      const url = URL.createObjectURL(selectedFile);
      objectUrlRef.current = url;
      setPreviewUrl(url);
      setFile(selectedFile);
      setErrorText(null);
    },
    [enqueueSnackbar]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted?.length) return;
      selectFile(accepted[0]);
    },
    [selectFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop,
    noClick: true,
    disabled: isSaving,
  });

  const handleClearSelection = () => {
    setFile(null);
    resetObjectUrl();
    setPreviewUrl(currentImage ?? null);
    setErrorText(null);
  };

  const handleSave = async () => {
    if (!file) {
      setErrorText('Selecione uma nova imagem para continuar.');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('PhotoFile', file);

      const { data } = await api.post<UploadResponse>(
        useMeRoutes ? '/users/me/photo' : `/users/me/${userId}/photo`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const uploadResponse = data ?? null;
      const newUrl =
        getUploadedPhotoUrl(uploadResponse) ?? currentImage ?? null;
      await onUploadSuccess(newUrl);
      enqueueSnackbar(
        uploadResponse?.message ?? 'Foto atualizada com sucesso!',
        {
          variant: 'success',
        }
      );
      onClose();
    } catch (error) {
      console.error('Profile picture update error:', error);
      const message = getErrorMessage(
        error,
        'Não foi possível atualizar a foto. Tente novamente.'
      );
      setErrorText(message);
      enqueueSnackbar(message, {
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCurrentImage = async () => {
    setIsSaving(true);
    try {
      await api.delete(
        useMeRoutes ? '/users/me/photo' : `/users/me/${userId}/photo`
      );
      setFile(null);
      resetObjectUrl();
      setPreviewUrl(null);
      setErrorText(null);
      await onUploadSuccess(null);
      enqueueSnackbar('Foto removida com sucesso!', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Profile picture delete error:', error);
      const message = getErrorMessage(
        error,
        'Não foi possível remover a foto. Tente novamente.'
      );
      setErrorText(message);
      enqueueSnackbar(message, {
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentPreview = previewUrl;

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">Foto de perfil</Typography>
        <Typography variant="body2" color="text.secondary">
          Faça upload de uma nova imagem para o perfil. Formatos sugeridos: PNG,
          JPG ou WEBP.
        </Typography>
      </Stack>

      <Box
        {...getRootProps()}
        sx={{
          borderRadius: 3,
          border: (theme) => `1px dashed ${theme.palette.divider}`,
          bgcolor: (theme) =>
            isDragActive
              ? theme.vars?.palette.action.hover
              : theme.vars?.palette.background.default,
          minHeight: 260,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          outline: 'none',
          transition: (theme) =>
            theme.transitions.create(['background-color', 'border-color']),
          cursor: isSaving ? 'not-allowed' : 'pointer',
        }}
      >
        <input {...getInputProps()} />
        {currentPreview ? (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <img
              src={currentPreview}
              alt={userName ? `Foto de ${userName}` : 'Foto de perfil'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
              }}
            >
              <Tooltip title="Abrir em nova guia">
                <span>
                  <IconButton
                    size="small"
                    component="a"
                    href={currentPreview}
                    target="_blank"
                    rel="noreferrer"
                    disabled={isSaving}
                    sx={{ bgcolor: 'rgba(18, 18, 18, 0.55)', color: '#fff' }}
                  >
                    <ZoomOutMapRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              {file && (
                <Tooltip title="Remover imagem selecionada">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleClearSelection}
                      disabled={isSaving}
                      sx={{ bgcolor: 'rgba(18, 18, 18, 0.55)', color: '#fff' }}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Box>
        ) : (
          <Stack
            spacing={2}
            alignItems="center"
            textAlign="center"
            px={4}
            py={6}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                border: (theme) => `2px dashed ${theme.palette.divider}`,
                display: 'grid',
                placeItems: 'center',
                color: 'text.secondary',
              }}
            >
              {initials ? (
                <Typography variant="h4" color="text.secondary">
                  {initials}
                </Typography>
              ) : (
                <ImageRoundedIcon sx={{ fontSize: 40 }} />
              )}
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">
                Arraste uma imagem aqui
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ou clique em &quot;Selecionar imagem&quot; para escolher um
                arquivo do seu computador.
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Tamanho máximo de {MAX_SIZE_MB}MB. Formatos suportados: PNG, JPG,
              JPEG, WEBP.
            </Typography>
          </Stack>
        )}
      </Box>

      <Stack direction="row" spacing={1.5} justifyContent="flex-start">
        <Button
          variant="outlined"
          startIcon={<UploadRoundedIcon />}
          onClick={open}
          disabled={isSaving}
        >
          Selecionar imagem
        </Button>
        {file && (
          <Button
            variant="text"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={handleClearSelection}
            disabled={isSaving}
          >
            Limpar seleção
          </Button>
        )}
        {!file && currentPreview && (
          <Button
            variant="text"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={handleDeleteCurrentImage}
            disabled={isSaving}
          >
            Remover foto atual
          </Button>
        )}
      </Stack>

      {errorText && (
        <Typography variant="caption" color="error">
          {errorText}
        </Typography>
      )}

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" mt={1}>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !file}
        >
          {isSaving ? 'Salvando...' : 'Salvar nova foto'}
        </Button>
      </Stack>
    </Stack>
  );
}

export default ProfilePictureModal;
