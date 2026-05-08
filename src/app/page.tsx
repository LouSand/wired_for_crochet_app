import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, go straight to projects
  if (user) {
    redirect('/projects')
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md text-center">
        {/* Logo / Brand */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-700">
            Wired for Crochet
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Track your crochet projects from start to finish — time, yarn, hooks, patterns, and pricing all in one place.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mb-8 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-lg bg-white p-3 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-900">⏱️ Time Tracking</p>
            <p className="text-xs text-gray-500">Track every session</p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-900">🧶 Yarn Inventory</p>
            <p className="text-xs text-gray-500">Manage your stash</p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-900">🔢 Row Counters</p>
            <p className="text-xs text-gray-500">Never lose your place</p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-900">💰 Pricing</p>
            <p className="text-xs text-gray-500">Price your work fairly</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/register"
            className="block w-full rounded-md bg-purple-600 px-4 py-3 text-center text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
