/**
 * Currency formatting utilities for per-project currency support.
 */

/**
 * Map of ISO 4217 currency codes to their display symbols.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
  CAD: 'C$',
  NZD: 'NZ$',
}

/**
 * Format a monetary amount with the appropriate currency symbol.
 * Falls back to the currency code if no symbol is found.
 *
 * @param amount - The numeric amount to format
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'GBP')
 * @returns Formatted string like "$12.50" or "JPY12.50"
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode
  return `${symbol}${amount.toFixed(2)}`
}
