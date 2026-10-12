export class AdministratorValidationError extends Error {}
export interface InitialAdministrator { username: string; displayName: string }

export function validateInitialAdministrator(value: unknown): InitialAdministrator {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AdministratorValidationError('administrator must be an object');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['username', 'displayName'].includes(key)) ||
      typeof input.username !== 'string' || !/^[A-Za-z0-9._-]{3,64}$/.test(input.username)) {
    throw new AdministratorValidationError('administrator requires a username of 3–64 ASCII letters, digits, dots, underscores or hyphens');
  }
  const username = input.username.toLowerCase();
  const displayName = input.displayName ?? username;
  if (typeof displayName !== 'string' || !displayName.trim() || [...displayName.trim()].length > 120 || /[\p{Cc}\p{Cs}]/u.test(displayName)) {
    throw new AdministratorValidationError('administrator.displayName must contain 1–120 characters without control characters');
  }
  return { username, displayName: displayName.trim() };
}

export function validateInitialPassword(value: unknown): asserts value is string {
  if (typeof value !== 'string' || [...value].length < 15 || [...value].length > 128 || /\p{Cs}/u.test(value)) {
    throw new AdministratorValidationError('Password must contain 15–128 Unicode characters');
  }
}
