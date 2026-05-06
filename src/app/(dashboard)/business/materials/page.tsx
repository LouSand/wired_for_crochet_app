import Link from 'next/link'
import { getMaterials } from '@/lib/actions/materials'
import { MATERIAL_CATEGORIES } from '@/types/business'
import type { MaterialCategory } from '@/types/business'

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const category = typeof params.category === 'string' ? params.category as MaterialCategory : undefined

  const { data: materials, error } = await getMaterials({ category })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your materials inventory.
          </p>
        </div>
        <Link
          href="/business/materials/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Add Material
        </Link>
      </div>

      {/* Filter */}
      <form className="mt-6" action="/business/materials" method="GET">
        <div className="flex gap-2">
          <select
            name="category"
            defaultValue={category ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Categories</option>
            {MATERIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Filter
          </button>
          {category && (
            <Link
              href="/business/materials"
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

      {/* Materials list */}
      {materials && materials.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            No materials found. Add your first material to get started.
          </p>
        </div>
      )}

      {materials && materials.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Colour
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Available
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cost/Unit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {materials.map((material) => {
                const available = Math.max(0, material.quantity_owned - material.quantity_used)
                const costPerUnit = material.cost_per_unit
                  ? `$${Number(material.cost_per_unit).toFixed(4)}`
                  : '—'
                return (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {material.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {material.colour ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {material.quantity_owned} {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {available} {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {costPerUnit}
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
