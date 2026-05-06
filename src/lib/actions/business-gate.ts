'use server'

import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types/business'

/**
 * Queries user_settings for the current user's subscription_tier.
 * Returns 'free' if no settings exist or no tier is set.
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 'free'
  }

  const { data } = await supabase
    .from('user_settings')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single()

  if (!data || !data.subscription_tier) {
    return 'free'
  }

  return data.subscription_tier as SubscriptionTier
}

/**
 * Asserts that the current user has a 'pro' subscription tier.
 * Returns an error object if not pro, or null if the user is pro.
 */
export async function assertProTier(): Promise<{ error: string } | null> {
  const tier = await getSubscriptionTier()

  if (tier !== 'pro') {
    return { error: 'Pro subscription required to access this feature.' }
  }

  return null
}
