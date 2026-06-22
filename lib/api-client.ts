import { auth } from './firebase';

const API_BASE = ''; // Use relative paths for client-side API calls to work on any origin

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Client-side API wrapper that automatically attaches the Firebase auth token.
 * Use this for all API calls from the browser.
 *
 * @example
 * const { data, error } = await apiClient<Job[]>('/api/jobs');
 * const { data } = await apiClient('/api/jobs', { method: 'POST', body: { title: 'Test' } });
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    // Get current user's ID token
    const user = auth.currentUser;
    let token: string | null = null;

    if (user) {
      token = await user.getIdToken();
    }

    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData — browser sets it with boundary
    if (body && !(body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: responseData.error || responseData.message || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      return {
        data: responseData as T,
        error: null,
        status: response.status,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      data: null,
      error: isTimeout ? 'Request timed out' : err instanceof Error ? err.message : 'An unexpected error occurred',
      status: isTimeout ? 408 : 0,
    };
  }
}
