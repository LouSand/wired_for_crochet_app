import Link from 'next/link'
import SupplierForm from '@/components/business/SupplierForm'

export default function NewSupplierPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/suppliers"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Suppliers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Supplier</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new supplier to your business contacts.
        </p>
      </div>

      <SupplierForm />
    </div>
  )
}
