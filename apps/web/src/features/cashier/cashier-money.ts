import type { Offering } from '@servicelane/api-contracts/menu';

export function money(minor: string, currency: string, scale: number): string {
  const digits = minor.padStart(scale + 1, '0');
  return `${currency} ${scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits}`;
}

export function offeringPrice(offering: Offering): string {
  if (offering.scale < 0 || offering.scale > 4) return 'Choose options for price';
  const asMinor = (value: string): bigint | undefined => {
    if (!/^\d+(?:\.\d{1,4})?$/.test(value) || (value.split('.')[1]?.length ?? 0) > offering.scale) return undefined;
    const [whole = '0', fraction = ''] = value.split('.');
    return BigInt(whole + fraction.padEnd(offering.scale, '0'));
  };
  if (offering.kind === 'combo') {
    let minimum = asMinor(offering.basePrice);
    if (minimum === undefined) return 'Choose options for price';
    for (const group of offering.choiceGroups) {
      const surcharges = group.options.map(option => asMinor(option.surcharge));
      if (surcharges.some(value => value === undefined) || surcharges.length < group.minimum) return 'Choose options for price';
      const available = surcharges.filter((value): value is bigint => value !== undefined).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      minimum += available.slice(0, group.minimum).reduce((sum, value) => sum + value, 0n);
    }
    const variable = offering.choiceGroups.some(group => group.maximum > 0 && group.options.length > 0);
    return `${variable ? 'From ' : ''}${money(minimum.toString(), offering.currencyCode, offering.scale)}`;
  }
  const prices = offering.variants.map(variant => asMinor(variant.price));
  if (!prices.length || prices.some(value => value === undefined)) return 'Choose options for price';
  const available = prices.filter((value): value is bigint => value !== undefined);
  const least = available.reduce((lowest, amount) => amount < lowest ? amount : lowest);
  const variable = prices.length > 1 || offering.addOnGroups.some(group => group.maximum > 0 && group.options.length > 0);
  return `${variable ? 'From ' : ''}${money(least.toString(), offering.currencyCode, offering.scale)}`;
}
