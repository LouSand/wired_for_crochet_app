'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculatePrice, type PricingInput } from '@/lib/pricing'
import type { PricingBreakdown } from '@/types/forms'
import type { PricingExtra } from '@/types/database'

export type PricingActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Calculate the full pricing breakdown for a project.
 * Fetches time sessions, yarn usages, extras, and hourly rate,
 * then computes the pricing breakdown.
 */
export async function calculateProjectPrice(projectId: string): Promise<{
  data: PricingBreakdown | null
  error: string | null
  hourlyRateMissing?: boolean
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to calculate pricing.' }
  }

  // Fetch the project to get hourly_rate_override
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, hourly_rate_override')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return { data: null, error: 'Project not found.' }
  }

  // Fetch user settings for default hourly rate
  const { data: settings } = await supabase
    .from('user_settings')
    .select('default_hourly_rate')
    .eq('user_id', user.id)
    .single()

  // Determine hourly rate: project override > default > 0
  const hourly_rate = project.hourly_rate_override ?? settings?.default_hourly_rate ?? 0

  if (hourly_rate === 0) {
    return { data: null, error: 'No hourly rate configured.', hourlyRateMissing: true }
  }

  // Fetch completed time sessions to compute total hours
  const { data: sessions } = await supabase
    .from('time_sessions')
    .select('start_time, end_time')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .not('end_time', 'is', null)

  let total_hours = 0
  if (sessions && sessions.length > 0) {
    const totalMs = sessions.reduce((sum, session) => {
      const start = new Date(session.start_time).getTime()
      const end = new Date(session.end_time!).getTime()
      return sum + (end - start)
    }, 0)
    total_hours = totalMs / (1000 * 60 * 60) // Convert ms to hours
  }

  // Fetch yarn usages with cost_per_unit from yarn_entries
  const { data: yarnUsages } = await supabase
    .from('yarn_usages')
    .select('quantity_used, yarn_entries(cost_per_unit)')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  let material_cost = 0
  if (yarnUsages && yarnUsages.length > 0) {
    material_cost = yarnUsages.reduce((sum, usage) => {
      const costPerUnit = (usage.yarn_entries as unknown as { cost_per_unit: number | null })?.cost_per_unit ?? 0
      return sum + (usage.quantity_used * costPerUnit)
    }, 0)
  }

  // Fetch pricing extras
  const { data: extras } = await supabase
    .from('pricing_extras')
    .select('description, amount')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  const pricingInput: PricingInput = {
    material_cost,
    total_hours,
    hourly_rate,
    extras: extras ?? [],
  }

  const breakdown = calculatePrice(pricingInput)

  return { data: breakdown, error: null }
}

/**
 * Add an extra cost to a project's pricing.
 * Accepts FormData for use with useActionState.
 */
export async function addPricingExtra(
  projectId: string,
  _prevState: PricingActionState,
  formData: FormData
): Promise<PricingActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add pricing extras.' }
  }

  const description = (formData.get('description') as string)?.trim()
  const amountStr = formData.get('amount') as string

  if (!description || description.length === 0) {
    return { fieldErrors: { description: ['Description is required.'] } }
  }

  if (description.length > 255) {
    return { fieldErrors: { description: ['Description must be 255 characters or less.'] } }
  }

  if (!amountStr || amountStr.trim() === '') {
    return { fieldErrors: { amount: ['Amount is required.'] } }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount < 0) {
    return { fieldErrors: { amount: ['Amount must be a valid non-negative number.'] } }
  }

  // Verify project belongs to user
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return { error: 'Project not found.' }
  }

  const { error } = await supabase.from('pricing_extras').insert({
    project_id: projectId,
    user_id: user.id,
    description,
    amount,
  })

  if (error) {
    return { error: 'Failed to add extra cost. Please try again.' }
  }

  revalidatePath(`/projects/${projectId}/pricing`)
  return null
}

/**
 * Delete a pricing extra by ID.
 */
export async function deletePricingExtra(extraId: string): Promise<PricingActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete pricing extras.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('pricing_extras')
    .select('id, project_id')
    .eq('id', extraId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Pricing extra not found.' }
  }

  const { error } = await supabase
    .from('pricing_extras')
    .delete()
    .eq('id', extraId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete extra cost. Please try again.' }
  }

  revalidatePath(`/projects/${existing.project_id}/pricing`)
  return null
}

/**
 * Fetch all pricing extras for a project.
 */
export async function getPricingExtras(projectId: string): Promise<{
  data: PricingExtra[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view pricing extras.' }
  }

  const { data, error } = await supabase
    .from('pricing_extras')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: 'Failed to fetch pricing extras.' }
  }

  return { data, error: null }
}
