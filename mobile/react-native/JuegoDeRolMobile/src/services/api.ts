const API_URL = 'http://10.0.2.2:3001/api';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const fallback = `Request failed: ${response.status}`;
    let message = fallback;
    try {
      const data = (await response.json()) as {error?: string};
      if (data?.error) {
        message = data.error;
      }
    } catch {
      message = fallback;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export {API_URL};
