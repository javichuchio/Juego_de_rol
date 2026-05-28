const API_CANDIDATES = [
  'http://127.0.0.1:3001/api',
  'http://10.0.2.2:3001/api',
  'http://172.31.28.29:3001/api',
];

let resolvedApiUrl: string | null = null;

async function isReachable(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function getApiUrl(): Promise<string> {
  if (resolvedApiUrl) {
    return resolvedApiUrl;
  }

  for (const candidate of API_CANDIDATES) {
    // eslint-disable-next-line no-await-in-loop
    if (await isReachable(candidate)) {
      resolvedApiUrl = candidate;
      return candidate;
    }
  }

  // Fallback conservador: mantiene comportamiento previo para emulador.
  resolvedApiUrl = 'http://10.0.2.2:3001/api';
  return resolvedApiUrl;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}${path}`, {
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

export {API_CANDIDATES};
