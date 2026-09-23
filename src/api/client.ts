import { useAuthStore } from '../store/useAuthStore.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    console.error(`[API Network Error] ${endpoint}:`, networkErr);
    throw new ApiError(
      "We couldn't connect to MarkDriller. Please check your internet connection and try again.",
      0
    );
  }

  // Parse response safely, handling non-JSON or proxy gateway errors (e.g. 502/504 HTML)
  let json: ApiResponse<T> | null = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok || !json?.success) {
    let errorMsg = json?.error?.message;

    if (!errorMsg) {
      if (response.status === 401) {
        // Automatically clear stale token on 401 session expiry
        if (typeof window !== 'undefined' && token && !endpoint.includes('/api/auth/login')) {
          useAuthStore.getState().clearSession();
        }
        errorMsg = 'Your session has expired. Please sign in again to continue.';
      } else if (response.status === 403) {
        errorMsg = "You don't have permission to perform this action.";
      } else if (response.status === 404) {
        errorMsg = 'The requested resource could not be found.';
      } else if (response.status === 429) {
        errorMsg = 'Too many requests. Please wait a moment before trying again.';
      } else if (response.status >= 500) {
        errorMsg = 'We’re unable to complete this request right now. Please try again shortly.';
      } else {
        errorMsg = response.statusText || 'We encountered an error processing your request.';
      }
    }

    throw new ApiError(errorMsg, response.status, json?.error?.details);
  }

  return json.data as T;
}

