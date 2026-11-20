import { HttpRequestError, request, write } from '../../shared/api/http-client.ts';

export type Account = { displayName: string; passwordChangeRequired: boolean; role?: 'administrator' | 'staff' };

export { HttpRequestError as AccessRequestError };

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function account(value: unknown): Account {
  if (!object(value) || typeof value.displayName !== 'string' || typeof value.passwordChangeRequired !== 'boolean') {
    throw new Error('Unexpected account response');
  }
  return { displayName: value.displayName, passwordChangeRequired: value.passwordChangeRequired, ...(value.role === 'administrator' || value.role === 'staff' ? { role: value.role } : {}) };
}

export async function currentAccount(): Promise<Account> { return account(await request('auth/me')); }
export async function login(username: string, password: string): Promise<Account> {
  const value = await write('auth/login', 'POST', { username, password });
  if (!object(value)) throw new Error('Unexpected login response');
  return account(value.account);
}
export async function changePassword(currentPassword: string, newPassword: string): Promise<Account> {
  const value = await write('auth/password', 'POST', { currentPassword, newPassword });
  if (!object(value)) throw new Error('Unexpected password response');
  return account(value.account);
}
export async function logout(): Promise<void> { await write('auth/logout', 'POST'); }
