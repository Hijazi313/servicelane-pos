export class BusinessValidationError extends Error {}
export class InstallationConflictError extends Error {
  constructor() { super('Installation already initialized or contains existing business data'); }
}
export class InstallationContextError extends Error {
  constructor() { super('Installation context is missing or inconsistent'); }
}

export interface InitialBusinessConfiguration {
  business: { name: string; currencyCode: string; timezone: string };
  branch: { name: string; address?: string };
}
export interface InstallationContext extends InitialBusinessConfiguration {
  businessId: string;
  branchId: string;
}

export function inputObject(value: unknown, allowed: readonly string[], field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new BusinessValidationError(`${field} has invalid fields`);
  }
  return value as Record<string, unknown>;
}

export function inputName(value: unknown, field: string, limit = 120): string {
  if (typeof value !== 'string' || !value.trim() || [...value.trim()].length > limit || /[\p{Cc}\p{Cs}]/u.test(value)) {
    throw new BusinessValidationError(`${field} must contain 1–${limit} characters without control characters`);
  }
  return value.trim();
}

export function validateBusinessConfiguration(value: unknown): InitialBusinessConfiguration {
  const root = inputObject(value, ['business', 'branch'], 'configuration');
  const business = inputObject(root.business, ['name', 'currencyCode', 'timezone'], 'business');
  const branch = inputObject(root.branch, ['name', 'address'], 'branch');
  if (typeof business.currencyCode !== 'string' ||
      !Intl.supportedValuesOf('currency').includes(business.currencyCode)) {
    throw new BusinessValidationError('business.currencyCode must be a supported uppercase ISO currency code');
  }
  let timezone: string;
  try {
    if (typeof business.timezone !== 'string' || !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(business.timezone)) throw new Error();
    timezone = new Intl.DateTimeFormat('en', { timeZone: business.timezone }).resolvedOptions().timeZone;
  } catch {
    throw new BusinessValidationError('business.timezone must be a supported IANA timezone');
  }
  return {
    business: { name: inputName(business.name, 'business.name'), currencyCode: business.currencyCode, timezone },
    branch: {
      name: inputName(branch.name, 'branch.name'),
      ...(branch.address === undefined ? {} : { address: inputName(branch.address, 'branch.address', 500) }),
    },
  };
}
