import Link from 'next/link'
import { getExpenses } from '@/lib/actions/expenses'
import { getSuppliers } from '@/lib/actions/suppliers'
import { getSettings } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/currency'
import { EXPENSE_CATEGORIES } from '@/types/business'
import type { ExpenseCategory } from '@/types/business'

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const category = typeof params.category === 'string' ? params.category as ExpenseCategory : undefined
  const supplier_id = typeof params.supplier_id === 'string' ? params.supplier_id : undefined
  const start_date = typeof params.start_date === 'string' ? params.start_date : undefined
  const end_date = typeof params.end_date === 'string' ? params.end_date : undefined

  const [{ data: expenses, error }, { data: suppliers }, settings] = await Promise.all([
    getExpenses({ category, supplier_id, start_date, end_date }),
    getSuppliers(),
    getSettings(),
  ])
  const currency = settings.default_currency

  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.cost), 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your business purchases and expenses.
          </p>
        </div>
        <Link
          href="/business/expenses/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Add Expense
        </Link>
      </div>

      {/* Running total */}
      <div className="mt-4 rounded-md bg-purple-50 p-4">
        <p className="text-sm text-purple-700">
          Total Expenses: <span className="font-semibold">{formatCurrency(totalExpenses, currency)}</span>
        </p>
      </div>

      {/* Filters */}
      <form className="mt-6" action="/business/expenses" method="GET">
        <div className="flex flex-wrap gap-3">
          <select
            name="category"
            defaultValue={category ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>

          <select
            name="supplier_id"
            defaultValue={supplier_id ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Suppliers</option>
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="start_date"
            defaultValue={start_date ?? ''}
            placeholder="Start date"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <input
            type="date"
            name="end_date"
            defaultValue={end_date ?? ''}
            placeholder="End date"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Filter
          </button>

          {(category || supplier_id || start_date || end_date) && (
            <Link
              href="/business/expenses"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Expense list */}
      {expenses && expenses.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            No expenses found. Add your first expense to get started.
          </p>
        </div>
      )}

      {expenses && expenses.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Supplier
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((expense) => {
                const supplierName = suppliers?.find((s) => s.id === expense.supplier_id)?.name
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {expense.purchase_date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        {expense.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(Number(expense.cost), currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {supplierName ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
