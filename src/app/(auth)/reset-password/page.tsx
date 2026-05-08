'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  resetPasswordRequest,
  updatePassword,
  type AuthState,
} from '@/lib/actions/auth'

function RequestResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPasswordRequest,
    null
  )

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
        Reset Password
      </h1>

      <p className="mb-6 text-center text-sm text-gray-600">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
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

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    null
  )

  if (state?.message) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
          Password Updated
        </h1>
        <div
          className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700"
          role="status"
          aria-live="polite"
        >
          {state.message}
        </div>
        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Sign in with your new password
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
        Set New Password
      </h1>

      <p className="mb-6 text-center text-sm text-gray-600">
        Enter your new password below.
      </p>

      {state?.error && (
        <div
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.password[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters long.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {state?.fieldErrors?.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  // If the user arrived via the reset link callback, show the update form
  const isUpdateMode = searchParams.get('mode') === 'update'

  if (isUpdateMode) {
    return <UpdatePasswordForm />
  }

  return <RequestResetForm />
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg bg-white p-8 shadow-md">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
