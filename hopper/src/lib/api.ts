import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { DashboardStats, Inspection, Station, TokenResponse, User } from './types';

// Fallback base URL depending on device platform
const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    android: 'http://10.0.2.2:8000',
    default: 'http://localhost:8000',
  });

export const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept 401 Unauthorized to sign out
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeAuthToken();
      router.replace('/auth/login' as any);
    }
    return Promise.reject(error);
  }
);

let currentToken: string | null = null;
const TOKEN_KEY = 'hopper_auth_token';

/**
 * Configure or clear the Authorization Bearer token header on Axios requests.
 */
export async function setAuthToken(token: string | null) {
  currentToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

export async function loadAuthToken(): Promise<string | null> {
  let token = null;
  if (Platform.OS !== 'web') {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } else {
    token = localStorage.getItem(TOKEN_KEY);
  }
  if (token) {
    currentToken = token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
}

export async function removeAuthToken() {
  await setAuthToken(null);
}

export function getAuthToken(): string | null {
  return currentToken;
}

// ==========================================
// API ENDPOINTS
// ==========================================

export async function loginUser(payload: any): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/api/v1/auth/login', payload);
  if (response.data?.access_token) {
    await setAuthToken(response.data.access_token);
  }
  return response.data;
}

export async function registerUser(payload: any): Promise<User> {
  const response = await api.post<User>('/api/v1/auth/register', payload);
  return response.data;
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await api.get('/health');
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function getStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>('/api/v1/dashboard/stats');
  return response.data;
}

export async function listInspections(page = 1, status?: string): Promise<Inspection[]> {
  const response = await api.get<Inspection[]>('/api/v1/inspections/', { params: { page, status } });
  return response.data;
}

export async function createInspection(stationId: string): Promise<Inspection> {
  const response = await api.post<Inspection>('/api/v1/inspections/', { station_id: stationId });
  return response.data;
}

export async function getPresignedUploadUrls(inspectionId: string, count: number, extension: string = 'jpg'): Promise<string[]> {
  const response = await api.post<{ urls: string[] }>(`/api/v1/inspections/${inspectionId}/media/presigned-urls`, {
    files_count: count,
    extension,
  });
  return response.data.urls;
}

export async function uploadToS3(presignedUrl: string, uri: string): Promise<void> {
  // For Expo, we fetch the local blob and PUT it to S3
  const response = await fetch(uri);
  const blob = await response.blob();
  
  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': blob.type || 'image/jpeg',
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to S3');
  }
}

export async function uploadMedia(inspectionId: string, uri: string): Promise<void> {
  // Real upload needs FormData
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('files', {
    uri,
    name: filename,
    type,
  } as any);

  await api.post(`/api/v1/inspections/${inspectionId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function analyzeInspection(inspectionId: string): Promise<void> {
  await api.post(`/api/v1/inspections/${inspectionId}/analyze`);
}

export async function detectStandaloneImage(uri: string): Promise<any> {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);

  const response = await api.post(`/api/v1/detection/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getInspection(inspectionId: string): Promise<Inspection> {
  const response = await api.get<Inspection>(`/api/v1/inspections/${inspectionId}`);
  return response.data;
}

/**
 * Safely extracts a user-readable error message from FastAPI responses or network issues.
 */
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError<{ detail?: string | Array<{ msg?: string; loc?: string[] }> }>;
    if (axiosError.response?.data?.detail) {
      const detail = axiosError.response.data.detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
    }
    if (axiosError.response?.status === 401) {
      return 'Invalid email or password. Please try again.';
    }
    if (axiosError.response?.status === 400) {
      return 'Bad request. Please verify your submitted information.';
    }
    if (!axiosError.response) {
      return `Cannot reach server at ${api.defaults.baseURL}. Please ensure the backend is running.`;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export default api;
