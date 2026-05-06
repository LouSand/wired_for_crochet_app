import Link from 'next/link'
import { getBusinessProfile } from '@/lib/actions/business-profile'
import BusinessProfileForm from '@/components/invoicing/business-profile-form'

export default async function BusinessProfileSettingsPage() {
  const { data: profile } = await getBusinessProfile()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/business/invoicing"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          ← Back to Invoicing
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure your business details for invoices and quotes.
        </p>
      </div>

      <BusinessProfileForm profile={profile} />
    </div>
  )
}
