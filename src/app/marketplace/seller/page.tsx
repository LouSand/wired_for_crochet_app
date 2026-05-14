'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSellerProfile, upsertSellerProfile } from '@/lib/actions/marketplace'
import type { SellerProfile } from '@/types/marketplace'

export default function SellerDashboardPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await getSellerProfile()
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name)
        setBio(data.bio ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.set('display_name', displayName)
    formData.set('bio', bio)

    const { data, error: err } = await upsertSellerProfile(formData)
    if (err) {
      setError(err)
    } else if (data) {
      setProfile(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/marketplace" className="text-sm text-purple-600 hover:text-purple-700">
            ← Back to Marketplace
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Set up your seller profile to start sharing patterns with the community.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Profile form */}
        <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Seller Profile</h2>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your shop name or display name"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {profile?.slug && (
              <p className="mt-1 text-xs text-gray-500">
                Your shop URL: /marketplace/sellers/{profile.slug}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell buyers about yourself and your patterns..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[40px]"
            >
              {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
            </button>
            {success && <span className="text-sm text-green-600">✓ Saved</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>

        {/* Publishing guide */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">How to Publish Patterns</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">1</span>
              <span>Set up your seller profile above (display name is required)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">2</span>
              <span>Go to any of your patterns in <Link href="/patterns" className="text-purple-600 hover:underline">My Patterns</Link></span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">3</span>
              <span>Click &quot;Publish to Marketplace&quot; and set your price (or free)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">4</span>
              <span>Your pattern will appear in the marketplace for others to discover</span>
            </li>
          </ol>
          <p className="text-xs text-gray-500">
            Free patterns can be published immediately. Paid pattern sales require Stripe Connect setup (coming soon).
          </p>
        </div>

        {/* Stripe status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Payment Setup</h2>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Coming soon:</span> Stripe Connect integration for paid pattern sales.
              For now, you can publish free patterns to build your audience.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
