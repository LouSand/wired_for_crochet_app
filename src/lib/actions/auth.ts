'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
  message?: string
  fieldErrors?: Record<string, string[]>
} | null

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Check if the error is about email not being confirmed
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      return { error: 'Please verify your email before signing in. Check your inbox for the verification link.' }
    }
    // Generic error message — don't reveal which field is incorrect
    return { error: 'Invalid email or password.' }
  }

  redirect('/projects')
}

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password || !confirmPassword) {
    return { error: 'All fields are required.' }
  }

  if (password !== confirmPassword) {
    return { fieldErrors: { confirmPassword: ['Passwords do not match.'] } }
  }

  if (password.length < 8) {
    return {
      fieldErrors: {
        password: ['Password must be at least 8 characters long.'],
      },
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return {
    message:
      'Account created successfully! Please check your email inbox (and spam folder) for a verification link. You must verify your email before you can sign in.',
  }
}

export async function resetPasswordRequest(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    message: 'If an account exists with that email, a reset link has been sent.',
  }
}

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'All fields are required.' }
  }

  if (password !== confirmPassword) {
    return { fieldErrors: { confirmPassword: ['Passwords do not match.'] } }
  }

  if (password.length < 8) {
    return {
      fieldErrors: {
        password: ['Password must be at least 8 characters long.'],
      },
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Password updated successfully.' }
}

export async function resendVerificationEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Verification email sent! Please check your inbox.' }
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
