import type { BackendAccessJWT } from 'next-auth';

import jwt from 'jsonwebtoken';

const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5001/api';

const REFRESH_ENDPOINT = `${API_BASE_URL.replace(/\/$/, '')}/refresh`;

/**
 * Refresh the access token by sending the refresh token.
 */
export async function refresh(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<BackendAccessJWT> {
  console.warn('[auth][refresh] request started', {
    endpoint: REFRESH_ENDPOINT,
    hasAccessToken: Boolean(tokens.accessToken),
    hasRefreshToken: Boolean(tokens.refreshToken),
  });

  try {
    if (!tokens.refreshToken) {
      throw Object.assign(new Error('Missing refresh token'), {
        response: {
          status: 400,
          statusText: 'BadRequest',
          data: { error: 'Refresh token not provided' },
        },
      });
    }

    const response = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokens),
      cache: 'no-store',
    });

    const rawPayload = await response
      .json()
      .catch(() => ({ error: 'Unable to parse refresh response' }));
    console.warn('[auth][refresh] response received', {
      status: response.status,
      ok: response.ok,
      payload: rawPayload,
    });
    if (!response.ok) {
      throw Object.assign(
        new Error(
          rawPayload?.error ||
            rawPayload?.message ||
            `Refresh request failed with status ${response.status}`
        ),
        {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: rawPayload,
          },
        }
      );
    }

    const data = rawPayload as BackendAccessJWT;

    if (!data?.accessToken) {
      throw new Error('Refresh response is missing accessToken');
    }

    return {
      ...data,
      refreshToken: data.refreshToken ?? tokens.refreshToken,
    };
  } catch (err) {
    console.error('[auth][refresh] request failed', {
      endpoint: REFRESH_ENDPOINT,
      error: err,
    });
    throw err;
  }
}

// Função utilitária para decodificar tokens (aqui você pode usar jwt-decode)
export const decodeToken = (token: string) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Função utilitária para verificar se token expirou
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp: number };
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};
