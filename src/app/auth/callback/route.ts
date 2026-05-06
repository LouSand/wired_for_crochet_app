import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/projects'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If the callback is for password reset, redirect to the update form
      if (next === '/reset-password') {
        return NextResponse.redirect(
          `${origin}/reset-password?mode=update`
        )
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error or no code, redirect to login with an error
  return NextResponse.redirect(`${origin}/login`)
}
