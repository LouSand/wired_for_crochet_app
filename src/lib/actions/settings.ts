'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SettingsState = {
  error?: string
  message?: string
} | null

export interface UserSettingsData {
  default_hourly_rate: number | null
}

/**
 * Fetch user settings, returning defaults if none exist.
 */
export async function getSettings(): Promise<UserSettingsData> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { default_hourly_rate: null }
  }

  const { data } = await supabase
    .from('user_settings')
    .select('default_hourly_rate')
    .eq('user_id', user.id)
    .single()

  if (!data) {
    return { default_hourly_rate: null }
  }

  return { default_hourly_rate: data.default_hourly_rate }
}

/**
 * Upsert user_settings record with default_hourly_rate.
 */
export async function updateSettings(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update settings.' }
  }

  const rateValue = formData.get('default_hourly_rate') as string

  if (!rateValue || rateValue.trim() === '') {
    return { error: 'Hourly rate is required.' }
  }

  const rate = parseFloat(rateValue)

  if (isNaN(rate) || rate < 0) {
    return { error: 'Hourly rate must be a valid non-negative number.' }
  }

  // Check if settings already exist
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('user_settings')
      .update({
        default_hourly_rate: rate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      return { error: 'Failed to update settings. Please try again.' }
    }
  } else {
    // Insert new record
    const { error } = await supabase.from('user_settings').insert({
      user_id: user.id,
      default_hourly_rate: rate,
    })

    if (error) {
      return { error: 'Failed to save settings. Please try again.' }
    }
  }

  revalidatePath('/settings')
  return { message: 'Settings saved successfully.' }
}
