import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/share-image/[projectId]
 * Returns a styled HTML page that can be screenshotted or shared as a project card.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch project data
  const { data: project } = await supabase
    .from('projects')
    .select('name, description, status, date_started, date_completed, pattern_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Fetch time sessions for total time
  const { data: sessions } = await supabase
    .from('time_sessions')
    .select('start_time, end_time')
    .eq('project_id', projectId)
    .not('end_time', 'is', null)

  const totalSeconds = (sessions ?? []).reduce((sum, s) => {
    return sum + Math.round((new Date(s.end_time!).getTime() - new Date(s.start_time).getTime()) / 1000)
  }, 0)

  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const timeStr = totalSeconds > 0 ? `${hours}h ${mins}m` : null

  // Fetch pattern name if linked
  let patternName: string | null = null
  if (project.pattern_id) {
    const { data: pattern } = await supabase
      .from('patterns')
      .select('title')
      .eq('id', project.pattern_id)
      .single()
    patternName = pattern?.title ?? null
  }

  const statusLabel = project.status === 'completed' ? '✅ Completed' : '🧶 In Progress'
  const dateStr = project.date_completed
    ? `Finished: ${new Date(project.date_completed).toLocaleDateString('en-GB')}`
    : project.date_started
      ? `Started: ${new Date(project.date_started).toLocaleDateString('en-GB')}`
      : null

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Wired for Crochet</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f0ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; box-shadow: 0 4px 24px rgba(128, 90, 213, 0.15); border: 2px solid #e9d5ff; }
    .brand { font-size: 12px; color: #9333ea; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
    .status { display: inline-block; font-size: 14px; padding: 4px 12px; border-radius: 20px; background: #f0fdf4; color: #166534; margin-bottom: 16px; }
    .meta { font-size: 14px; color: #6b7280; margin-bottom: 6px; }
    .pattern { font-size: 14px; color: #7c3aed; margin-top: 12px; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Wired for Crochet</div>
    <h1 class="title">${escapeHtml(project.name)}</h1>
    <div class="status">${statusLabel}</div>
    ${dateStr ? `<p class="meta">📅 ${dateStr}</p>` : ''}
    ${timeStr ? `<p class="meta">⏱ Time spent: ${timeStr}</p>` : ''}
    ${project.description ? `<p class="meta">${escapeHtml(project.description)}</p>` : ''}
    ${patternName ? `<p class="pattern">📐 Pattern: ${escapeHtml(patternName)}</p>` : ''}
    <div class="footer">Made with Wired for Crochet</div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
