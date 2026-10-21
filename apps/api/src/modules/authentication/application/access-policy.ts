import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { AdministratorValidationError, validateInitialAdministrator, validateInitialPassword } from './initial-administrator.js';
import type { Account, Session } from './access-store.js';

export type AccessErrorReason = 'INVALID_INPUT' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED' | 'UNAVAILABLE';
export class AccessError extends Error {
  constructor(readonly reason: AccessErrorReason, message: string, readonly retryDelaySeconds?: number) { super(message); }
}
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract verify(password: string, phc: string): Promise<boolean>;
  abstract dummy(password: string): Promise<boolean>;
}
export const token = (): string => randomBytes(32).toString('base64url');
export const digest = (value: string): string => createHash('sha256').update(value).digest('hex');
export function tokenDigest(value: string | undefined): string | undefined {
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? digest(value) : undefined;
}
export function sameToken(one: string | undefined, two: string): boolean {
  return typeof one === 'string' && /^[A-Za-z0-9_-]{43}$/.test(one) && one.length === two.length && timingSafeEqual(Buffer.from(one), Buffer.from(two));
}
export function sessionActive(session: Session, now: Date): boolean {
  const age = now.getTime() - session.createdAt.getTime();
  const idle = now.getTime() - session.lastActivityAt.getTime();
  return session.revokedAt === null && age >= 0 && idle >= 0 && age < 12 * 60 * 60_000 && idle < 30 * 60_000;
}
export function safeAccount(account: Account) {
  return { id: account.id, businessId: account.businessId, username: account.username, displayName: account.displayName,
    status: account.status, role: account.role, branchIds: [...account.branchIds], passwordChangeRequired: account.passwordChangeRequired };
}
export function object(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) throw new AccessError('INVALID_INPUT', 'Invalid input');
  return value as Record<string, unknown>;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new AccessError('INVALID_INPUT', 'Invalid identifier');
  return value.toLowerCase();
}
export function password(value: unknown): string {
  try { validateInitialPassword(value); return value; }
  catch (error) { if (error instanceof AdministratorValidationError) throw new AccessError('INVALID_INPUT', 'Invalid password'); throw error; }
}
export function identity(value: unknown) {
  try { return validateInitialAdministrator(value); }
  catch (error) { if (error instanceof AdministratorValidationError) throw new AccessError('INVALID_INPUT', 'Invalid identity'); throw error; }
}
export function role(value: unknown): Account['role'] {
  if (value !== 'administrator' && value !== 'staff') throw new AccessError('INVALID_INPUT', 'Invalid role');
  return value;
}
