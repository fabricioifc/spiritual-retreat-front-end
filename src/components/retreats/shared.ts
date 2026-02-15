import { Session } from 'next-auth';

import axios from 'axios';

import apiClient from '@/src/lib/axiosClientInstance';
import { Retreat } from '@/src/types/retreats';

type RetreatPayload = {
  id?: string;
  name: string;
  edition: string;
  theme: string;
  shortDescription?: string;
  longDescription?: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  feeFazer: number;
  feeServir: number;
  stateShort?: string;
  city?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  instructor?: string;
  capacity?: number;
  maleSlots?: number;
  femaleSlots?: number;
  westRegionPct?: number;
  otherRegionPct?: number;
  imagesToDelete?: (string | number)[];
};

export type RetreatImageType = 'Banner' | 'Thumbnail' | 'Gallery';

export type UploadRetreatImagePayload = {
  file: File;
  type: RetreatImageType;
  altText?: string;
  order?: number;
};

export type UploadRetreatImageResponse = {
  retreatId: string;
  storageKey: string;
  imageUrl: string;
  type: RetreatImageType;
  order: number;
  uploadedAt: string;
  replacedExisting: boolean;
};

export const fetchRetreatData = async (
  retreatId: string
): Promise<Retreat | null> => {
  try {
    const result = await apiClient.get(`/Retreats/${retreatId}`);
    return result.data;
  } catch (error) {
    console.error('Erro ao buscar dados do retiro:', error);
    throw error;
  }
};

export const fetchRetreatDataServer = async (
  retreatId: string,
  session: Session | null
): Promise<Retreat | null> => {
  try {
    const baseURL =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5001/api';

    const response = await fetch(`${baseURL}/Retreats/${retreatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.tokens?.accessToken
          ? { Authorization: `Bearer ${session.tokens.accessToken}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch retreat data (status ${response.status})`
      );
    }

    const data = (await response.json()) as Retreat;
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do retiro:', error);
    throw error;
  }
};

const buildRetreatPayload = (data: RetreatPayload) => {
  const payload: Record<string, unknown> = {
    id: data.id,
    name: { value: data.name },
    edition: data.edition,
    theme: data.theme,
    shortDescription: data.shortDescription,
    longDescription: data.longDescription,
    startDate: data.startDate,
    endDate: data.endDate,
    maleSlots: data.maleSlots ?? 60,
    femaleSlots: data.femaleSlots ?? 60,
    registrationStart: data.registrationStart,
    registrationEnd: data.registrationEnd,
    location: data.location,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    feeFazer: {
      amount: typeof data.feeFazer === 'number' ? data.feeFazer : 0,
      currency: 'BRL',
    },
    feeServir: {
      amount: typeof data.feeServir === 'number' ? data.feeServir : 0,
      currency: 'BRL',
    },
    westRegionPct:
      typeof data.westRegionPct === 'number'
        ? { value: data.westRegionPct }
        : { value: 85.0 },
    otherRegionPct:
      typeof data.otherRegionPct === 'number'
        ? { value: data.otherRegionPct }
        : { value: 15.0 },
  };
  if (data.imagesToDelete && data.imagesToDelete.length > 0) {
    payload.imagesToDelete = data.imagesToDelete;
  }
  return payload;
};

export const createRetreat = async (
  payload: RetreatPayload,
  files?: File[]
): Promise<{ retreatId: string }> => {
  try {
    const builtPayload = buildRetreatPayload(payload);

    if (files && files.length > 0) {
      const body = new FormData();
      body.append(
        'payload',
        new Blob([JSON.stringify(builtPayload)], { type: 'application/json' })
      );
      files.forEach((file) => body.append('images', file));

      const response = await apiClient.post<{ retreatId: string }>(
        '/Retreats',
        body
      );
      return response.data;
    }

    const response = await apiClient.post<{ retreatId: string }>(
      '/Retreats',
      builtPayload
    );
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { error?: string })?.error ?? error.message)
      : 'Erro ao criar retiro. Tente novamente.';
    throw new Error(message);
  }
};

export const updateRetreat = async (
  retreatId: string,
  payload: RetreatPayload,
  files?: File[]
): Promise<Retreat> => {
  try {
    const builtPayload = buildRetreatPayload({ id: retreatId, ...payload });

    if (files && files.length > 0) {
      const body = new FormData();
      body.append(
        'payload',
        new Blob([JSON.stringify(builtPayload)], { type: 'application/json' })
      );
      files.forEach((file) => body.append('images', file));

      const response = await apiClient.put<Retreat>(
        `/Retreats/${retreatId}`,
        body
      );
      return response.data;
    }

    const response = await apiClient.put<Retreat>(
      `/Retreats/${retreatId}`,
      builtPayload
    );
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { error?: string })?.error ?? error.message)
      : 'Erro ao atualizar retiro. Tente novamente.';
    throw new Error(message);
  }
};

export const deleteRetreat = async (retreatId: string): Promise<void> => {
  try {
    await apiClient.delete(`/Retreats/${retreatId}`);
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { error?: string })?.error ?? error.message)
      : 'Erro ao excluir retiro. Tente novamente.';
    throw new Error(message);
  }
};

export const uploadRetreatImage = async (
  retreatId: string,
  payload: UploadRetreatImagePayload
): Promise<UploadRetreatImageResponse> => {
  try {
    const body = new FormData();
    body.append('File', payload.file);
    body.append('Type', payload.type);
    if (payload.altText) body.append('AltText', payload.altText);
    if (typeof payload.order === 'number') {
      body.append('Order', String(payload.order));
    }

    const response = await apiClient.post<UploadRetreatImageResponse>(
      `/Retreats/${retreatId}/images`,
      body
    );
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { error?: string })?.error ?? error.message)
      : 'Erro ao enviar imagem do retiro. Tente novamente.';
    throw new Error(message);
  }
};

export const deleteRetreatImage = async (
  retreatId: string,
  storageId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/Retreats/${retreatId}/images/${storageId}`);
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { error?: string })?.error ?? error.message)
      : 'Erro ao remover imagem do retiro. Tente novamente.';
    throw new Error(message);
  }
};

export const reorderRetreatImages = async (
  retreatId: string,
  imageOrders: { storageId: string; newOrder: number }[]
): Promise<void> => {
  try {
    await apiClient.put(`/Retreats/${retreatId}/images/reorder`, {
      imageOrders,
    });
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { error?: string })?.error ?? error.message)
      : 'Erro ao reordenar imagens do retiro. Tente novamente.';
    throw new Error(message);
  }
};
