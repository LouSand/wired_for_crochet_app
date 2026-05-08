import { describe, it, expect } from 'vitest'
import { calculatePrice, type PricingInput } from './pricing'

describe('calculatePrice', () => {
  it('computes total with all zero inputs', () => {
    const input: PricingInput = {
      material_cost: 0,
      total_hours: 0,
      hourly_rate: 0,
      extras: [],
    }
    const result = calculatePrice(input)
    expect(result.material_cost).toBe(0)
    expect(result.time_cost).toBe(0)
    expect(result.extras_total).toBe(0)
    expect(result.profit_margin_amount).toBe(0)
    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
  })

  it('computes time cost as total_hours × hourly_rate', () => {
    const input: PricingInput = {
      material_cost: 0,
      total_hours: 5.5,
      hourly_rate: 20,
      extras: [],
    }
    const result = calculatePrice(input)
    expect(result.time_cost).toBe(110)
    expect(result.total).toBe(110)
  })

  it('includes material cost in total', () => {
    const input: PricingInput = {
      material_cost: 25.50,
      total_hours: 0,
      hourly_rate: 15,
      extras: [],
    }
    const result = calculatePrice(input)
    expect(result.material_cost).toBe(25.50)
    expect(result.total).toBe(25.50)
  })

  it('sums extra costs correctly', () => {
    const input: PricingInput = {
      material_cost: 10,
      total_hours: 2,
      hourly_rate: 15,
      extras: [
        { description: 'Shipping', amount: 5 },
        { description: 'Packaging', amount: 3.50 },
      ],
    }
    const result = calculatePrice(input)
    expect(result.extras_total).toBe(8.50)
    // total = 10 + (2*15) + 8.50 = 48.50
    expect(result.total).toBe(48.50)
  })

  it('applies profit margin as percentage of subtotal', () => {
    const input: PricingInput = {
      material_cost: 20,
      total_hours: 4,
      hourly_rate: 10,
      extras: [],
      profit_margin_percent: 25,
    }
    const result = calculatePrice(input)
    // subtotal = 20 + 40 = 60
    // profit = 60 * 25 / 100 = 15
    expect(result.subtotal).toBe(60)
    expect(result.profit_margin_amount).toBe(15)
    expect(result.total).toBe(75)
  })

  it('applies profit margin as fixed amount', () => {
    const input: PricingInput = {
      material_cost: 20,
      total_hours: 4,
      hourly_rate: 10,
      extras: [],
      profit_margin_fixed: 30,
    }
    const result = calculatePrice(input)
    // subtotal = 20 + 40 = 60
    // profit = 30 (fixed)
    expect(result.subtotal).toBe(60)
    expect(result.profit_margin_amount).toBe(30)
    expect(result.total).toBe(90)
  })

  it('fixed profit margin takes precedence over percentage', () => {
    const input: PricingInput = {
      material_cost: 100,
      total_hours: 0,
      hourly_rate: 10,
      extras: [],
      profit_margin_percent: 50,
      profit_margin_fixed: 20,
    }
    const result = calculatePrice(input)
    // Fixed takes precedence: profit = 20
    expect(result.profit_margin_amount).toBe(20)
    expect(result.total).toBe(120)
  })

  it('returns zero profit margin when neither is set', () => {
    const input: PricingInput = {
      material_cost: 50,
      total_hours: 3,
      hourly_rate: 10,
      extras: [{ description: 'Extra', amount: 5 }],
    }
    const result = calculatePrice(input)
    expect(result.profit_margin_amount).toBe(0)
    // total = 50 + 30 + 5 = 85
    expect(result.total).toBe(85)
  })

  it('returns zero profit margin when values are null', () => {
    const input: PricingInput = {
      material_cost: 50,
      total_hours: 1,
      hourly_rate: 10,
      extras: [],
      profit_margin_percent: null,
      profit_margin_fixed: null,
    }
    const result = calculatePrice(input)
    expect(result.profit_margin_amount).toBe(0)
    expect(result.total).toBe(60)
  })

  it('returns correct breakdown fields', () => {
    const input: PricingInput = {
      material_cost: 15,
      total_hours: 2.5,
      hourly_rate: 12,
      extras: [{ description: 'Buttons', amount: 4 }],
      profit_margin_percent: 10,
    }
    const result = calculatePrice(input)
    expect(result.material_cost).toBe(15)
    expect(result.time_cost).toBe(30)
    expect(result.hourly_rate).toBe(12)
    expect(result.total_hours).toBe(2.5)
    expect(result.extras).toEqual([{ description: 'Buttons', amount: 4 }])
    expect(result.extras_total).toBe(4)
    expect(result.subtotal).toBe(49) // 15 + 30 + 4
    expect(result.profit_margin_percent).toBe(10)
    expect(result.profit_margin_fixed).toBeNull()
    expect(result.profit_margin_amount).toBeCloseTo(4.9) // 49 * 10 / 100
    expect(result.total).toBeCloseTo(53.9)
  })

  it('handles fractional hours correctly', () => {
    const input: PricingInput = {
      material_cost: 0,
      total_hours: 1.75, // 1 hour 45 minutes
      hourly_rate: 20,
      extras: [],
    }
    const result = calculatePrice(input)
    expect(result.time_cost).toBe(35)
    expect(result.total).toBe(35)
  })

  it('handles zero profit margin percentage', () => {
    const input: PricingInput = {
      material_cost: 50,
      total_hours: 2,
      hourly_rate: 10,
      extras: [],
      profit_margin_percent: 0,
    }
    const result = calculatePrice(input)
    expect(result.profit_margin_amount).toBe(0)
    expect(result.total).toBe(70)
  })
})
