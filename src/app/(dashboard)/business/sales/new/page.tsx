import Link from 'next/link'
import { getProducts } from '@/lib/actions/business-products'
import { getCustomers } from '@/lib/actions/customers'
import SaleForm from '@/components/business/SaleForm'

export default async function NewSalePage() {
  const { data: products } = await getProducts(true)
  const { data: customers } = await getCustomers()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/sales"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Sales
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Record Sale</h1>
        <p className="mt-1 text-sm text-gray-600">
          Record a new sale or revenue entry.
        </p>
      </div>

      <SaleForm products={products ?? []} customers={customers ?? []} />
    </div>
  )
}
