import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProduct } from '@/lib/actions/business-products'
import { getBomForProduct, calculateProductBomCost } from '@/lib/actions/bom'
import { getMaterials } from '@/lib/actions/materials'
import BomEditor from '@/components/business/BomEditor'
import BomBreakdown from '@/components/business/BomBreakdown'

export default async function BomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: product, error: productError } = await getProduct(id)

  if (productError || !product) {
    notFound()
  }

  const { data: lineItems } = await getBomForProduct(id)
  const { data: materials } = await getMaterials()
  const { data: breakdown } = await calculateProductBomCost(id)

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/business/products/${id}`}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to {product.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Bill of Materials — {product.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage the materials needed to produce this product.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BomEditor
            productId={id}
            lineItems={lineItems ?? []}
            materials={materials ?? []}
          />
        </div>

        <div>
          {breakdown && <BomBreakdown breakdown={breakdown} />}
        </div>
      </div>
    </div>
  )
}
