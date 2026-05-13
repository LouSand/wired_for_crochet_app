'use server'

import { createClient } from '@/lib/supabase/server'
import { assertProPlusTier } from './business-gate'

export interface ProjectInvoiceData {
  projectId: string
  projectName: string
  customerId: string | null
  currency: string
  items: { description: string; quantity: number; unit_price: number }[]
  total: number
}

/**
 * Gather project data (time tracked, materials, extras) and format it
 * as invoice line items ready to pre-populate the invoice form.
 *
 * Line items generated:
 * 1. Labour: total hours × hourly rate
 * 2. Materials: total yarn/material cost (if any)
 * 3. Each pricing extra as a separate line item
 */
export async function getProjectInvoiceData(projectId: string): Promise<{
  data: ProjectInvoiceData | null
  error: string | null
}> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { data: null, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, customer_name, hourly_rate_override, currency')
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

  const hourlyRate = project.hourly_rate_override ?? settings?.default_hourly_rate ?? 0

  // Fetch completed time sessions
  const { data: sessions } = await supabase
    .from('time_sessions')
    .select('start_time, end_time')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .not('end_time', 'is', null)

  let totalHours = 0
  if (sessions && sessions.length > 0) {
    const totalMs = sessions.reduce((sum, session) => {
      const start = new Date(session.start_time).getTime()
      const end = new Date(session.end_time!).getTime()
      return sum + (end - start)
    }, 0)
    totalHours = totalMs / (1000 * 60 * 60)
  }

  // Fetch yarn usages with cost
  const { data: yarnUsages } = await supabase
    .from('yarn_usages')
    .select('quantity_used, yarn_entries(name, cost_per_unit)')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  let materialCost = 0
  if (yarnUsages && yarnUsages.length > 0) {
    materialCost = yarnUsages.reduce((sum, usage) => {
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
    .order('created_at', { ascending: true })

  // Try to find a matching customer in the customers table
  // If not found, auto-create one so the invoice has a linked customer
  let customerId: string | null = null
  if (project.customer_name) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', project.customer_name)
      .limit(1)
      .maybeSingle()

    if (customer) {
      customerId = customer.id
    } else {
      // Auto-create customer record so user can add email later
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: project.customer_name,
        })
        .select('id')
        .single()

      if (newCustomer) {
        customerId = newCustomer.id
      }
    }
  }

  // Build line items
  const items: { description: string; quantity: number; unit_price: number }[] = []

  // Labour line item (round hours to 2 decimal places)
  if (totalHours > 0 && hourlyRate > 0) {
    const roundedHours = Math.round(totalHours * 100) / 100
    items.push({
      description: `Labour - ${project.name} (${roundedHours} hours @ ${hourlyRate}/hr)`,
      quantity: 1,
      unit_price: Math.round(roundedHours * hourlyRate * 100) / 100,
    })
  }

  // Materials line item
  if (materialCost > 0) {
    items.push({
      description: 'Materials (yarn and supplies)',
      quantity: 1,
      unit_price: Math.round(materialCost * 100) / 100,
    })
  }

  // Extras as individual line items
  if (extras && extras.length > 0) {
    for (const extra of extras) {
      items.push({
        description: extra.description,
        quantity: 1,
        unit_price: Number(extra.amount),
      })
    }
  }

  // If no items at all, add a placeholder
  if (items.length === 0) {
    items.push({
      description: project.name,
      quantity: 1,
      unit_price: 0,
    })
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  return {
    data: {
      projectId: project.id,
      projectName: project.name,
      customerId,
      currency: project.currency,
      items,
      total,
    },
    error: null,
  }
}
