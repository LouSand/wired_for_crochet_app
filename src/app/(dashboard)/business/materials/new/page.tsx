import Link from 'next/link'
import MaterialForm from '@/components/business/MaterialForm'

export default function NewMaterialPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/materials"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Materials
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Material</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new material to your inventory.
        </p>
      </div>

      <MaterialForm />
    </div>
  )
}
