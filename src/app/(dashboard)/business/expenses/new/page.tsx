import Link from 'next/link'
import { getSuppliers } from '@/lib/actions/suppliers'
import ExpenseForm from '@/components/business/ExpenseForm'

export default async function NewExpensePage() {
  const { data: suppliers } = await getSuppliers()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/expenses"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Expenses
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Expense</h1>
        <p className="mt-1 text-sm text-gray-600">
          Record a new business purchase or expense.
        </p>
      </div>

      <ExpenseForm suppliers={suppliers ?? []} />
    </div>
  )
}
