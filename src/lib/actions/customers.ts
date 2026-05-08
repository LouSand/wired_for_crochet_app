'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { customerFormSchema } from '@/lib/validators/customer'
import { assertProTier } from './business-gate'
import type { CustomerRow } from '@/types/business'

export type CustomerActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new customer for the authenticated user.
 */
export async function createCustomer(
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add a customer.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    email: (formData.get('email') as string) || '',
    phone: (formData.get('phone') as string) || '',
    address: (formData.get('address') as string) || '',
    notes: (formData.get('notes') as string) || '',
  }

  const result = customerFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase.from('customers').insert({
    user_id: user.id,
    name: validated.name,
    email: validated.email || null,
    phone: validated.phone || null,
    address: validated.address || null,
    notes: validated.notes || null,
  })

  if (error) {
    return { error: 'Failed to create customer. Please try again.' }
  }

  revalidatePath('/business/customers')
  return null
}

/**
 * Update an existing customer.
 */
export async function updateCustomer(
  id: string,
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a customer.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Customer not found.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    email: (formData.get('email') as string) || '',
    phone: (formData.get('phone') as string) || '',
    address: (formData.get('address') as string) || '',
    notes: (formData.get('notes') as string) || '',
  }

  const result = customerFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase
    .from('customers')
    .update({
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      notes: validated.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update customer. Please try again.' }
  }

  revalidatePath('/business/customers')
  revalidatePath(`/business/customers/${id}`)
  return null
}

/**
 * Delete a customer. Junction records cascade.
 */
export async function deleteCustomer(id: string): Promise<CustomerActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a customer.' }
  }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete customer. Please try again.' }
  }

  revalidatePath('/business/customers')
  return null
}

/**
 * Fetch all customers for the authenticated user with optional name/email search.
 */
export async function getCustomers(search?: string): Promise<{
  data: CustomerRow[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view customers.' }
  }

  let query = supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch customers.' }
  }

  return { data: data as CustomerRow[], error: null }
}

/**
 * Fetch a single customer by ID with linked projects.
 */
export async function getCustomer(id: string): Promise<{
  data: (CustomerRow & { customer_projects: Array<{ id: string; project_id: string }> }) | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view this customer.' }
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*, customer_projects(id, project_id)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'Customer not found.' }
  }

  return { data, error: null }
}

/**
 * Link a customer to a project via the customer_projects junction table.
 */
export async function linkCustomerToProject(
  customerId: string,
  projectId: string
): Promise<CustomerActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to link a customer to a project.' }
  }

  const { error } = await supabase.from('customer_projects').insert({
    customer_id: customerId,
    project_id: projectId,
    user_id: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This customer is already linked to this project.' }
    }
    return { error: 'Failed to link customer to project. Please try again.' }
  }

  revalidatePath(`/business/customers/${customerId}`)
  return null
}
