import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface BackupData {
  data: {
    projects?: Array<Record<string, unknown>>
    patterns?: Array<Record<string, unknown>>
    yarn_entries?: Array<Record<string, unknown>>
    hook_entries?: Array<Record<string, unknown>>
  }
}

/**
 * POST /api/backup/import
 * Accepts a JSON body from a backup export and upserts the data back into the user's tables.
 * Basic implementation covering: projects, patterns, yarn_entries, hook_entries.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: BackupData
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.data) {
    return NextResponse.json({ error: 'Missing "data" field in backup' }, { status: 400 })
  }

  const results: Record<string, { imported: number; errors: number }> = {}

  // Import projects
  if (body.data.projects && Array.isArray(body.data.projects)) {
    let imported = 0
    let errors = 0
    for (const project of body.data.projects) {
      const { error } = await supabase.from('projects').upsert({
        ...project,
        user_id: user.id, // Always override user_id with current user
      }, { onConflict: 'id' })
      if (error) errors++
      else imported++
    }
    results.projects = { imported, errors }
  }

  // Import patterns
  if (body.data.patterns && Array.isArray(body.data.patterns)) {
    let imported = 0
    let errors = 0
    for (const pattern of body.data.patterns) {
      const { error } = await supabase.from('patterns').upsert({
        ...pattern,
        user_id: user.id,
      }, { onConflict: 'id' })
      if (error) errors++
      else imported++
    }
    results.patterns = { imported, errors }
  }

  // Import yarn_entries
  if (body.data.yarn_entries && Array.isArray(body.data.yarn_entries)) {
    let imported = 0
    let errors = 0
    for (const entry of body.data.yarn_entries) {
      const { error } = await supabase.from('yarn_entries').upsert({
        ...entry,
        user_id: user.id,
      }, { onConflict: 'id' })
      if (error) errors++
      else imported++
    }
    results.yarn_entries = { imported, errors }
  }

  // Import hook_entries
  if (body.data.hook_entries && Array.isArray(body.data.hook_entries)) {
    let imported = 0
    let errors = 0
    for (const entry of body.data.hook_entries) {
      const { error } = await supabase.from('hook_entries').upsert({
        ...entry,
        user_id: user.id,
      }, { onConflict: 'id' })
      if (error) errors++
      else imported++
    }
    results.hook_entries = { imported, errors }
  }

  return NextResponse.json({
    success: true,
    message: 'Import completed',
    results,
  })
}
