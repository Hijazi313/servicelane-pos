import { CURRENCY_PRECISION } from '../../../common/currency-precision.js';
export function supportedOrderCurrency(currencyCode: string, scale: number): boolean {
  return /^[A-Z]{3}$/.test(currencyCode) && Number.isInteger(scale) && scale >= 0 && scale <= 4 && CURRENCY_PRECISION[currencyCode] === scale;
}
