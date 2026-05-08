import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupplier } from '@/lib/actions/suppliers'
import SupplierForm from '@/components/business/SupplierForm'

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: supplier, error } = await getSupplier(id)

  if (error || !supplier) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/business/suppliers/${id}`}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Supplier
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Supplier</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update supplier details.
        </p>
      </div>

      <SupplierForm supplier={supplier} />
    </div>
  )
}
