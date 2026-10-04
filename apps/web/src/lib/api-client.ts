const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/v1';

let memoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getAccessToken = () => memoryAccessToken;

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (memoryAccessToken) {
    headers.set('Authorization', `Bearer ${memoryAccessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Includes httpOnly refresh cookies
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && (contentType.includes('application/json') || contentType.includes('application/problem+json'));
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.problem = data;
    err.status = response.status;
    throw err;
  }

  return data;
}
