import type { MenuErrorReason } from "../domain/catalogue.js";
const statuses: Record<MenuErrorReason, 400 | 404 | 409 | 503> = {
  INVALID_INPUT: 400,
  DEFINITION_TOO_LARGE: 400,
  NOT_FOUND: 404,
  SELECTION_UNAVAILABLE: 409,
  CURRENCY_CHANGED: 409,
  STALE_REVISION: 409,
  CATALOGUE_CAPACITY: 409,
  UNSUPPORTED_CURRENCY: 503,
  CATALOGUE_UNAVAILABLE: 503,
};
export function menuErrorStatus(
  reason: MenuErrorReason,
): 400 | 404 | 409 | 503 {
  return statuses[reason] ?? 503;
}
