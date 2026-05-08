import { describe, it, expect } from 'vitest'
import { formatCurrency, CURRENCY_SYMBOLS } from './currency'

describe('formatCurrency', () => {
  it('formats USD amounts with $ symbol', () => {
    expect(formatCurrency(12.5, 'USD')).toBe('$12.50')
  })

  it('formats GBP amounts with £ symbol', () => {
    expect(formatCurrency(99.99, 'GBP')).toBe('£99.99')
  })

  it('formats EUR amounts with € symbol', () => {
    expect(formatCurrency(0, 'EUR')).toBe('€0.00')
  })

  it('formats AUD amounts with A$ symbol', () => {
    expect(formatCurrency(1234.5, 'AUD')).toBe('A$1234.50')
  })

  it('formats CAD amounts with C$ symbol', () => {
    expect(formatCurrency(50, 'CAD')).toBe('C$50.00')
  })

  it('formats NZD amounts with NZ$ symbol', () => {
    expect(formatCurrency(7.1, 'NZD')).toBe('NZ$7.10')
  })

  it('falls back to currency code for unknown currencies', () => {
    expect(formatCurrency(100, 'JPY')).toBe('JPY100.00')
  })

  it('always formats to exactly 2 decimal places', () => {
    expect(formatCurrency(1.1, 'USD')).toBe('$1.10')
    expect(formatCurrency(1.999, 'USD')).toBe('$2.00')
    expect(formatCurrency(0.005, 'USD')).toBe('$0.01')
  })
})

describe('CURRENCY_SYMBOLS', () => {
  it('contains all supported currencies', () => {
    expect(CURRENCY_SYMBOLS).toHaveProperty('USD', '$')
    expect(CURRENCY_SYMBOLS).toHaveProperty('GBP', '£')
    expect(CURRENCY_SYMBOLS).toHaveProperty('EUR', '€')
    expect(CURRENCY_SYMBOLS).toHaveProperty('AUD', 'A$')
    expect(CURRENCY_SYMBOLS).toHaveProperty('CAD', 'C$')
    expect(CURRENCY_SYMBOLS).toHaveProperty('NZD', 'NZ$')
  })
})
