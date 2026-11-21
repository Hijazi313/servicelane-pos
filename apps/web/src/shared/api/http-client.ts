export class HttpRequestError extends Error {
  constructor(public readonly status: number, public readonly problem?: unknown) {
    super('HTTP request failed');
  }
}

export async function request(path: string, options?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api/v1/${path}`, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok) {
    let problem: unknown;
    try { problem = await response.json(); } catch { /* Some failures have no JSON body. */ }
    throw new HttpRequestError(response.status, problem);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

export async function write(path: string, method: 'POST' | 'PUT', body?: object): Promise<unknown> {
  const proof = await request('auth/csrf');
  if (typeof proof !== 'object' || proof === null || !('csrfToken' in proof) || typeof proof.csrfToken !== 'string') {
    throw new Error('Unexpected CSRF response');
  }
  return request(path, {
    method,
    headers: { 'X-CSRF-Token': proof.csrfToken, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
