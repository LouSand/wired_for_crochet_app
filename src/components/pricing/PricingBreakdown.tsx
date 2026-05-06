'use client'

import type { PricingBreakdown as PricingBreakdownType } from '@/types/forms'
import { formatCurrency } from '@/lib/currency'

interface PricingBreakdownProps {
  breakdown: PricingBreakdownType
  currency?: string
}

function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function PricingBreakdown({ breakdown, currency = 'USD' }: PricingBreakdownProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Price Breakdown</h2>

      <div className="space-y-3">
        {/* Material Cost */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Material Cost</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(breakdown.material_cost, currency)}
          </span>
        </div>

        {/* Time Cost */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span>Time Cost</span>
            <span className="ml-1 text-xs text-gray-400">
              ({formatHours(breakdown.total_hours)} × {formatCurrency(breakdown.hourly_rate, currency)}/hr)
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(breakdown.time_cost, currency)}
          </span>
        </div>

        {/* Extra Costs */}
        {breakdown.extras.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Extra Costs</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(breakdown.extras_total, currency)}
              </span>
            </div>
            <div className="ml-4 space-y-0.5">
              {breakdown.extras.map((extra, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs text-gray-400"
                >
                  <span>{extra.description}</span>
                  <span>{formatCurrency(extra.amount, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtotal */}
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(breakdown.subtotal, currency)}
          </span>
        </div>

        {/* Profit Margin */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span>Profit Margin</span>
            {breakdown.profit_margin_percent != null && breakdown.profit_margin_percent > 0 && (
              <span className="ml-1 text-xs text-gray-400">
                ({breakdown.profit_margin_percent}%)
              </span>
            )}
            {breakdown.profit_margin_fixed != null && breakdown.profit_margin_fixed > 0 && (
              <span className="ml-1 text-xs text-gray-400">(fixed)</span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(breakdown.profit_margin_amount, currency)}
          </span>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">
            Suggested Price
          </span>
          <span className="text-lg font-bold text-purple-700">
            {formatCurrency(breakdown.total, currency)}
          </span>
        </div>
      </div>
    </div>
  )
}
