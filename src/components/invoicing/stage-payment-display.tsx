import type { InvoiceRow } from '@/types/invoicing'

interface StagePaymentDisplayProps {
  invoice: Pick<InvoiceRow, 'total' | 'amount_paid' | 'deposit_percent' | 'stage2_percent' | 'final_percent'>
}

export default function StagePaymentDisplay({ invoice }: StagePaymentDisplayProps) {
  const total = Number(invoice.total)
  const amountPaid = Number(invoice.amount_paid)

  const depositAmount = (total * invoice.deposit_percent) / 100
  const stage2Amount = (total * invoice.stage2_percent) / 100
  const finalAmount = (total * invoice.final_percent) / 100

  const depositThreshold = depositAmount
  const stage2Threshold = depositAmount + stage2Amount

  const depositCovered = amountPaid >= depositThreshold
  const stage2Covered = amountPaid >= stage2Threshold
  const finalCovered = amountPaid >= total

  const stages = [
    {
      label: 'Deposit',
      percent: invoice.deposit_percent,
      amount: depositAmount,
      covered: depositCovered,
    },
    {
      label: 'Stage 2',
      percent: invoice.stage2_percent,
      amount: stage2Amount,
      covered: stage2Covered,
    },
    {
      label: 'Final',
      percent: invoice.final_percent,
      amount: finalAmount,
      covered: finalCovered,
    },
  ]

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                stage.covered
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {stage.covered ? '✓' : index + 1}
            </span>
            <span className="text-sm text-gray-700">
              {stage.label} ({stage.percent}%)
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                stage.covered
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {stage.covered ? 'Covered' : 'Uncovered'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">£{stage.amount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}
