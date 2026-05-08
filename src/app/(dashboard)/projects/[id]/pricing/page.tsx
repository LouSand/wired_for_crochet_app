import { notFound } from 'next/navigation'
import Link from 'next/link'
import { calculateProjectPrice, getPricingExtras } from '@/lib/actions/pricing'
import { getProject } from '@/lib/actions/projects'
import PricingBreakdown from '@/components/pricing/PricingBreakdown'
import AddExtraForm from '@/components/pricing/AddExtraForm'
import ExtrasList from '@/components/pricing/ExtrasList'

export default async function PricingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [priceResult, extrasResult, projectResult] = await Promise.all([
    calculateProjectPrice(id),
    getPricingExtras(id),
    getProject(id),
  ])

  if (priceResult.error && !priceResult.hourlyRateMissing && !priceResult.data) {
    notFound()
  }

  const extras = extrasResult.data ?? []
  const projectCurrency = projectResult.data?.currency ?? 'USD'

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← Back to project
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing Calculator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Calculate a suggested selling price based on materials, time, and extras.
        </p>
      </div>

      {/* Hourly rate missing prompt */}
      {priceResult.hourlyRateMissing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-medium text-amber-800">
            Hourly Rate Required
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            No hourly rate is configured. Set a default rate in your{' '}
            <Link
              href="/settings"
              className="font-medium underline hover:text-amber-900"
            >
              settings
            </Link>{' '}
            or set a project-specific rate on the{' '}
            <Link
              href={`/projects/${id}`}
              className="font-medium underline hover:text-amber-900"
            >
              project page
            </Link>
            .
          </p>
        </div>
      )}

      {/* Pricing breakdown */}
      {priceResult.data && <PricingBreakdown breakdown={priceResult.data} currency={projectCurrency} />}

      {/* Extra costs section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Extra Costs</h2>
        <ExtrasList extras={extras} />
        <div className="border-t border-gray-100 pt-4">
          <AddExtraForm projectId={id} />
        </div>
      </div>

      {/* Profit margin info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Profit Margin</h2>
        <p className="text-sm text-gray-500">
          Profit margin is applied on top of the subtotal (materials + time + extras).
          You can set it as a percentage or a fixed amount. Configure this by editing
          the project pricing settings or using the pricing property test overrides.
        </p>
        <p className="text-xs text-gray-400">
          Tip: A 20-30% profit margin is common for handmade items.
        </p>
      </div>
    </div>
  )
}
