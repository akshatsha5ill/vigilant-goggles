import { auth } from '../firebase/config';

const BASE_URL = '/api';

const getHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
  }
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }
  return response.json();
};

export const apiClient = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: await getHeaders(),
    });
    return handleResponse<T>(response);
  },
  post: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: await getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },
  put: async <T = any>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },
  patch: async <T = any>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },
  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse<T>(response);
  },
};
