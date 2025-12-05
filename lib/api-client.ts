import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
  statusCode?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp?: string;
}

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.error?.message || 'An unexpected error occurred',
          code: data.error?.code,
          details: data.error?.details,
          statusCode: response.status,
        };
      }

      return data;
    } catch (error: unknown) {
      // If it's already our structured error, throw it
      if (error && typeof error === 'object' && 'statusCode' in error) throw error;

      // Otherwise wrap it
      throw {
        message: error instanceof Error ? error.message : 'Network error',
        statusCode: 500,
        details: error,
      };
    }
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: ApiError) => void
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      if (response.success && response.data) {
        setData(response.data);
        if (onSuccess) onSuccess(response.data);
      } else {
        // Should be caught by ApiClient, but just in case
        throw { message: 'Operation failed' };
      }
    } catch (err: unknown) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'An error occurred',
        code: err && typeof err === 'object' && 'code' in err ? (err.code as string) : undefined,
        details: err && typeof err === 'object' && 'details' in err ? err.details : undefined,
        statusCode: err && typeof err === 'object' && 'statusCode' in err ? (err.statusCode as number) : undefined
      };
      setError(apiError);
      if (onError) onError(apiError);
      else toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}
