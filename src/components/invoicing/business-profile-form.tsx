'use client'

import { useActionState } from 'react'
import { useRef, useState } from 'react'
import {
  updateBusinessProfile,
  uploadBusinessLogo,
} from '@/lib/actions/business-profile'
import type { BusinessProfile, ProfileActionState } from '@/types/invoicing'

interface BusinessProfileFormProps {
  profile?: BusinessProfile | null
}

export default function BusinessProfileForm({ profile }: BusinessProfileFormProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(profile?.logo_url ?? null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [state, formAction, pending] = useActionState<ProfileActionState | null, FormData>(
    updateBusinessProfile,
    null
  )

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    setLogoError(null)

    const formData = new FormData()
    formData.append('logo', file)

    const result = await uploadBusinessLogo(formData)

    if (result.error) {
      setLogoError(result.error)
    } else if (result.url) {
      setLogoUrl(result.url)
    }

    setLogoUploading(false)
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {/* Success message */}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-4" role="status">
          <p className="text-sm text-green-700">Business profile updated successfully.</p>
        </div>
      )}

      {/* General error */}
      {state?.error && !state?.success && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Logo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Business Logo</label>
        <div className="mt-2 flex items-center gap-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Business logo preview"
              className="h-16 w-16 rounded-md border border-gray-200 object-contain"
            />
          )}
          <div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {logoUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleLogoUpload}
              className="hidden"
              aria-label="Upload business logo"
            />
            <p className="mt-1 text-xs text-gray-500">JPEG or PNG, max 5 MB</p>
            {logoError && (
              <p className="mt-1 text-sm text-red-600" role="alert">{logoError}</p>
            )}
          </div>
        </div>
        {/* Hidden input to pass logo_url with the form */}
        <input type="hidden" name="logo_url" value={logoUrl ?? ''} />
      </div>

      {/* Company Name */}
      <div>
        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          required
          defaultValue={profile?.company_name ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.company_name ? 'company_name-error' : undefined}
        />
        {state?.fieldErrors?.company_name && (
          <p id="company_name-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.company_name[0]}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={3}
          defaultValue={profile?.address ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          defaultValue={profile?.phone ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue={profile?.email ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby={state?.fieldErrors?.email ? 'email-error' : undefined}
        />
        {state?.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      {/* Bank Account Name */}
      <div>
        <label htmlFor="bank_account_name" className="block text-sm font-medium text-gray-700">
          Bank Account Name
        </label>
        <input
          type="text"
          id="bank_account_name"
          name="bank_account_name"
          defaultValue={profile?.bank_account_name ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Bank Account Number */}
      <div>
        <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">
          Bank Account Number
        </label>
        <input
          type="text"
          id="bank_account_number"
          name="bank_account_number"
          defaultValue={profile?.bank_account_number ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      {/* Bank Sort Code */}
      <div>
        <label htmlFor="bank_sort_code" className="block text-sm font-medium text-gray-700">
          Bank Sort Code
        </label>
        <input
          type="text"
          id="bank_sort_code"
          name="bank_sort_code"
          placeholder="XX-XX-XX"
          defaultValue={profile?.bank_sort_code ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-describedby="sort-code-hint"
        />
        <p id="sort-code-hint" className="mt-1 text-xs text-gray-500">
          Format: XX-XX-XX (e.g., 12-34-56)
        </p>
        {state?.fieldErrors?.bank_sort_code && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {state.fieldErrors.bank_sort_code[0]}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
