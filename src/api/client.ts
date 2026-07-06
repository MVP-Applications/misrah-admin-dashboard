import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { API_ENDPOINTS } from './endpoints';
import * as tokenStorage from '../features/auth/tokenStorage';
import type { ApiError, ApiErrorResponse } from './types';

// The one axios instance every feature's api.ts should use. Never construct
// axios directly elsewhere — see API_INTEGRATION.md.
export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers.set('x-api-key', env.API_KEY);
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data) {
      return {
        statusCode: data.statusCode ?? error.response?.status ?? 0,
        message: Array.isArray(data.message) ? data.message.join(' ') : data.message,
        error: data.error,
      };
    }
    if (error.request) {
      return { statusCode: 0, message: 'Network error — could not reach the server.' };
    }
  }
  return { statusCode: 0, message: error instanceof Error ? error.message : 'Unknown error' };
}

// Lets AuthContext react to a session dying mid-app (a silent refresh that
// ultimately fails) without this module depending on React. Set once by
// AuthContext on mount.
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(callback: () => void): void {
  onSessionExpired = callback;
}

// Dedupes concurrent 401s into a single refresh call instead of firing one
// refresh request per failed request.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh_token = tokenStorage.getRefreshToken();
  if (!refresh_token) {
    throw new Error('No refresh token available');
  }
  // Deliberately bypasses apiClient's interceptors (plain axios call) so this
  // request can never itself trigger the 401 retry logic below.
  const response = await axios.post(
    `${env.API_BASE_URL}${API_ENDPOINTS.admin.auth.refresh}`,
    { refresh_token },
    { headers: { 'x-api-key': env.API_KEY, 'Content-Type': 'application/json' } },
  );
  // UNCONFIRMED shape — see features/auth/types.ts.
  const { access_token, refresh_token: newRefreshToken } = response.data as {
    access_token: string;
    refresh_token: string;
  };
  tokenStorage.setAccessToken(access_token);
  tokenStorage.setRefreshToken(newRefreshToken);
  return access_token;
}

function getRefreshedAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const AUTH_ENDPOINTS_EXEMPT_FROM_RETRY: string[] = [
  API_ENDPOINTS.admin.auth.login,
  API_ENDPOINTS.admin.auth.refresh,
];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isExemptEndpoint = Boolean(
      originalRequest?.url && AUTH_ENDPOINTS_EXEMPT_FROM_RETRY.includes(originalRequest.url),
    );

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isExemptEndpoint) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await getRefreshedAccessToken();
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      } catch {
        tokenStorage.clearAll();
        onSessionExpired?.();
        return Promise.reject(normalizeError(error));
      }
    }

    return Promise.reject(normalizeError(error));
  },
);
