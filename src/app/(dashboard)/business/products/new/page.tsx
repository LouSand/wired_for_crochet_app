import Link from 'next/link'
import ProductForm from '@/components/business/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/products"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new product to your catalog.
        </p>
      </div>

      <ProductForm />
    </div>
  )
}
