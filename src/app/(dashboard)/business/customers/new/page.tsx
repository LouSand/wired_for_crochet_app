import Link from 'next/link'
import CustomerForm from '@/components/business/CustomerForm'

export default function NewCustomerPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/customers"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Customer</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new customer to your database.
        </p>
      </div>

      <CustomerForm />
    </div>
  )
}
