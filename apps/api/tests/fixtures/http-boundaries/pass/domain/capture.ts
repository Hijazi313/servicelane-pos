export class CaptureError extends Error {
  constructor(readonly code: 'INVALID_SELECTION' | 'UNAVAILABLE') { super(code); }
}
export interface Account { status: 'active' | 'disabled' }
export const price = 400;
export const account = { status: 'active' };
