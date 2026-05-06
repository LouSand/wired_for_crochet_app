'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SettingsState = {
  error?: string
  message?: string
} | null

export interface UserSettingsData {
  default_hourly_rate: number | null
  default_currency: string
  default_profit_margin: number | null
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
    return { default_hourly_rate: null, default_currency: 'GBP', default_profit_margin: null }
  }

  const { data } = await supabase
    .from('user_settings')
    .select('default_hourly_rate, default_currency, default_profit_margin')
    .eq('user_id', user.id)
    .single()

  if (!data) {
    return { default_hourly_rate: null, default_currency: 'GBP', default_profit_margin: null }
  }

  return {
    default_hourly_rate: data.default_hourly_rate,
    default_currency: data.default_currency ?? 'GBP',
    default_profit_margin: data.default_profit_margin ?? null,
  }
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
  const currencyValue = formData.get('default_currency') as string
  const profitMarginValue = formData.get('default_profit_margin') as string

  const rate = rateValue && rateValue.trim() !== '' ? parseFloat(rateValue) : null
  const currency = currencyValue && currencyValue.trim() !== '' ? currencyValue.trim() : 'GBP'
  const profitMargin = profitMarginValue && profitMarginValue.trim() !== '' ? parseFloat(profitMarginValue) : null

  if (rate !== null && (isNaN(rate) || rate < 0)) {
    return { error: 'Hourly rate must be a valid non-negative number.' }
  }

  if (profitMargin !== null && (isNaN(profitMargin) || profitMargin < 0)) {
    return { error: 'Profit margin must be a valid non-negative number.' }
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
        default_currency: currency,
        default_profit_margin: profitMargin,
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
      default_currency: currency,
      default_profit_margin: profitMargin,
    })

    if (error) {
      return { error: 'Failed to save settings. Please try again.' }
    }
  }

  revalidatePath('/settings')
  return { message: 'Settings saved successfully.' }
}
