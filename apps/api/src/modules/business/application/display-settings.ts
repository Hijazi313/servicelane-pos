import { BusinessValidationError, inputName, inputObject } from './business-configuration.js';
export interface DisplayView {
  revision: number; businessName: string; branchName: string; branchAddress: string | null; currencyCode: string; timezone: string;
}
export interface DisplayReplacement { expectedRevision: number; businessName: string; branchName: string; branchAddress: string | null }
export type DisplayErrorCode = 'INVALID_DISPLAY_SETTINGS' | 'STALE_DISPLAY_SETTINGS' | 'REVISION_CAPACITY' | 'DISPLAY_SETTINGS_UNAVAILABLE';
export class DisplaySettingsError extends Error {
  constructor(readonly code: DisplayErrorCode, readonly revision?: number) { super(code); }
}
export function displayReplacement(value: unknown): DisplayReplacement {
  try {
    const row = inputObject(value, ['expectedRevision', 'businessName', 'branchName', 'branchAddress'], 'display');
    if (typeof row.expectedRevision !== 'number' || !Number.isInteger(row.expectedRevision) || row.expectedRevision < 0 || row.expectedRevision > 2147483647) throw new BusinessValidationError();
    return { expectedRevision: row.expectedRevision, businessName: inputName(row.businessName, 'businessName'),
      branchName: inputName(row.branchName, 'branchName'), branchAddress: row.branchAddress === null ? null : inputName(row.branchAddress, 'branchAddress', 500) };
  } catch (error) {
    if (error instanceof BusinessValidationError) throw new DisplaySettingsError('INVALID_DISPLAY_SETTINGS');
    throw error;
  }
}
