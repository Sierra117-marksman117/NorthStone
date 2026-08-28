import type { PropertyPurpose } from '@/types';

export const RENT_MINIMUM_PRICE = 5_000;
export const BUY_MINIMUM_PRICE = 1_500_000;

export interface PropertyPriceFilterErrors {
  purpose?: string;
  minPrice?: string;
  maxPrice?: string;
}

function parsedPrice(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

export function validatePropertyPriceFilters(input: {
  purpose: PropertyPurpose | '';
  minPrice: string;
  maxPrice: string;
}): PropertyPriceFilterErrors {
  const errors: PropertyPriceFilterErrors = {};
  const minimum = parsedPrice(input.minPrice);
  const maximum = parsedPrice(input.maxPrice);
  const hasMinimum = minimum !== undefined;
  const hasMaximum = maximum !== undefined;
  const hasPrice = hasMinimum || hasMaximum;

  if (hasPrice && !input.purpose) {
    errors.purpose = 'Choose Buy or Rent before entering a price range.';
    if (hasMinimum) errors.minPrice = 'Choose Buy or Rent first.';
    if (hasMaximum) errors.maxPrice = 'Choose Buy or Rent first.';
    return errors;
  }

  const floor =
    input.purpose === 'RENT'
      ? RENT_MINIMUM_PRICE
      : input.purpose === 'BUY'
        ? BUY_MINIMUM_PRICE
        : undefined;
  const formattedFloor = floor?.toLocaleString('en-IN');

  if (hasMinimum && (!Number.isFinite(minimum) || (floor !== undefined && minimum < floor))) {
    errors.minPrice = `Minimum valid price is ₹${formattedFloor}${input.purpose === 'RENT' ? ' per month' : ''}.`;
  }
  if (hasMaximum && (!Number.isFinite(maximum) || (floor !== undefined && maximum < floor))) {
    errors.maxPrice = `Minimum valid price is ₹${formattedFloor}${input.purpose === 'RENT' ? ' per month' : ''}.`;
  }

  if (
    hasMinimum &&
    hasMaximum &&
    Number.isFinite(minimum) &&
    Number.isFinite(maximum) &&
    !errors.minPrice &&
    !errors.maxPrice &&
    maximum <= minimum
  ) {
    errors.maxPrice = 'Maximum price must be greater than minimum price.';
  }

  return errors;
}
