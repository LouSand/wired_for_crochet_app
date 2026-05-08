'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resendVerificationEmail, type AuthState } from '@/lib/actions/auth'

export default function VerifyEmailPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resendVerificationEmail,
    null
  )

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
        Verify Your Email
      </h1>

      <p className="mb-6 text-center text-sm text-gray-600">
        We sent a verification link to your email address. Please check your
        inbox and click the link to verify your account.
      </p>

      {state?.message && (
        <div
          className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700"
          role="status"
          aria-live="polite"
        >
          {state.message}
        </div>
      )}

      {state?.error && (
        <div
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      )}

      <div className="rounded-md bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">
          Didn&apos;t receive the email?
        </p>
        <form action={formAction} className="space-y-3">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter your email to resend"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
