import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/actions/settings'

/**
 * GET /api/settings
 * Returns user settings for client components.
 */
export async function GET() {
  const settings = await getSettings()
  return NextResponse.json(settings)
}
