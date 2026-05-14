import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/backup
 * Exports all user data as a JSON file for backup/GDPR compliance.
 * Includes signed URLs for all uploaded files (photos, receipts).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch all user data
  const [
    { data: projects },
    { data: patterns },
    { data: timeSessions },
    { data: counters },
    { data: yarnEntries },
    { data: hookEntries },
    { data: notes },
    { data: expenses },
    { data: invoices },
    { data: customers },
    { data: settings },
    { data: progressPhotos },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user.id),
    supabase.from('patterns').select('*').eq('user_id', user.id),
    supabase.from('time_sessions').select('*').eq('user_id', user.id),
    supabase.from('counters').select('*').eq('user_id', user.id),
    supabase.from('yarn_entries').select('*').eq('user_id', user.id),
    supabase.from('hook_entries').select('*').eq('user_id', user.id),
    supabase.from('notes').select('*').eq('user_id', user.id),
    supabase.from('purchases').select('*').eq('user_id', user.id),
    supabase.from('invoices').select('*, invoice_items(*)').eq('user_id', user.id),
    supabase.from('customers').select('*').eq('user_id', user.id),
    supabase.from('user_settings').select('*').eq('user_id', user.id),
    supabase.from('progress_photos').select('*').eq('user_id', user.id),
  ])

  // Collect all file paths from photos, patterns, yarn entries, and expenses
  const filePaths: Array<{ type: string; path: string; signedUrl: string | null }> = []

  // Progress photos
  for (const photo of (progressPhotos ?? [])) {
    if (photo.file_path) {
      const { data: signedData } = await supabase.storage
        .from('progress-photos')
        .createSignedUrl(photo.file_path, 3600) // 1 hour expiry
      filePaths.push({
        type: 'progress_photo',
        path: photo.file_path,
        signedUrl: signedData?.signedUrl ?? null,
      })
    }
  }

  // Pattern files
  for (const pattern of (patterns ?? [])) {
    if (pattern.file_path) {
      const { data: signedData } = await supabase.storage
        .from('pattern-files')
        .createSignedUrl(pattern.file_path, 3600)
      filePaths.push({
        type: 'pattern_file',
        path: pattern.file_path,
        signedUrl: signedData?.signedUrl ?? null,
      })
    }
  }

  // Yarn photos
  for (const yarn of (yarnEntries ?? [])) {
    if (yarn.photo_path) {
      const { data: signedData } = await supabase.storage
        .from('yarn-photos')
        .createSignedUrl(yarn.photo_path, 3600)
      filePaths.push({
        type: 'yarn_photo',
        path: yarn.photo_path,
        signedUrl: signedData?.signedUrl ?? null,
      })
    }
  }

  // Log the export
  await supabase.from('data_export_log').insert({
    user_id: user.id,
    export_type: 'full_backup',
  })

  const backup = {
    exported_at: new Date().toISOString(),
    user_email: user.email,
    data: {
      projects: projects ?? [],
      patterns: patterns ?? [],
      time_sessions: timeSessions ?? [],
      counters: counters ?? [],
      yarn_entries: yarnEntries ?? [],
      hook_entries: hookEntries ?? [],
      notes: notes ?? [],
      expenses: expenses ?? [],
      invoices: invoices ?? [],
      customers: customers ?? [],
      settings: settings ?? [],
    },
    files: filePaths,
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="wired-for-crochet-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
