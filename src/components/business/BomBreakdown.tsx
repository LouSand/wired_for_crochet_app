import type { BomCostBreakdown } from '@/lib/bom-calculator'

interface BomBreakdownProps {
  breakdown: BomCostBreakdown
}

export default function BomBreakdown({ breakdown }: BomBreakdownProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>

      {breakdown.invalid_line_items > 0 && (
        <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ {breakdown.invalid_line_items} line item{breakdown.invalid_line_items > 1 ? 's have' : ' has'} a deleted material and {breakdown.invalid_line_items > 1 ? 'are' : 'is'} excluded from the cost calculation.
          </p>
        </div>
      )}

      <dl className="space-y-3">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-600">Material Cost</dt>
          <dd className="text-sm font-medium text-gray-900">${breakdown.material_cost.toFixed(2)}</dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-sm text-gray-600">Labour Cost</dt>
          <dd className="text-sm font-medium text-gray-900">${breakdown.labour_cost.toFixed(2)}</dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-sm text-gray-600">Extras</dt>
          <dd className="text-sm font-medium text-gray-900">${breakdown.extras_total.toFixed(2)}</dd>
        </div>

        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <dt className="text-sm font-medium text-gray-900">Total Production Cost</dt>
          <dd className="text-sm font-bold text-gray-900">${breakdown.total_production_cost.toFixed(2)}</dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-sm text-gray-600">Profit Margin</dt>
          <dd className="text-sm font-medium text-gray-900">+${breakdown.profit_margin_amount.toFixed(2)}</dd>
        </div>

        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <dt className="text-sm font-semibold text-purple-700">Suggested Sell Price</dt>
          <dd className="text-lg font-bold text-purple-700">${breakdown.suggested_sell_price.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  )
}
