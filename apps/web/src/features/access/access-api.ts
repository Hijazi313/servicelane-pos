export type Account = { displayName: string; passwordChangeRequired: boolean };

export class AccessRequestError extends Error {
  constructor(public readonly status: number) { super('Access request failed'); }
}

async function request(path: string, options?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api/v1/${path}`, { ...options, credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new AccessRequestError(response.status);
  if (response.status === 204) return undefined;
  return response.json();
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function account(value: unknown): Account {
  if (!object(value) || typeof value.displayName !== 'string' || typeof value.passwordChangeRequired !== 'boolean') {
    throw new Error('Unexpected account response');
  }
  return { displayName: value.displayName, passwordChangeRequired: value.passwordChangeRequired };
}

async function csrf(): Promise<string> {
  const value = await request('auth/csrf');
  if (!object(value) || typeof value.csrfToken !== 'string') throw new Error('Unexpected CSRF response');
  return value.csrfToken;
}

async function mutate(path: string, body?: object): Promise<unknown> {
  const token = await csrf();
  return request(path, {
    method: 'POST',
    headers: { 'X-CSRF-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function currentAccount(): Promise<Account> { return account(await request('auth/me')); }
export async function login(username: string, password: string): Promise<Account> {
  const value = await mutate('auth/login', { username, password });
  if (!object(value)) throw new Error('Unexpected login response');
  return account(value.account);
}
export async function changePassword(currentPassword: string, newPassword: string): Promise<Account> {
  const value = await mutate('auth/password', { currentPassword, newPassword });
  if (!object(value)) throw new Error('Unexpected password response');
  return account(value.account);
}
export async function logout(): Promise<void> { await mutate('auth/logout'); }
