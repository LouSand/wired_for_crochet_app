import { notFound } from 'next/navigation'
import { getProject } from '@/lib/actions/projects'
import { getTimeSessions, getActiveSession } from '@/lib/actions/time-sessions'
import { getCounters } from '@/lib/actions/counters'
import { getNotes } from '@/lib/actions/notes'
import { createClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@/lib/supabase/storage'
import ProjectDashboard from './ProjectDashboard'
import type { Pattern, Note } from '@/types/database'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [
    { data: project, error },
    { data: sessions, totalDurationSeconds },
    { data: activeSession },
    { data: counters },
    { data: notes },
  ] = await Promise.all([
    getProject(id),
    getTimeSessions(id),
    getActiveSession(id),
    getCounters(id),
    getNotes(id),
  ])

  if (error || !project) {
    notFound()
  }

  // Fetch linked pattern data if pattern_id is set
  let pattern: Pattern | null = null
  let patternFileUrl: string | null = null
  if (project.pattern_id) {
    const supabase = await createClient()
    const { data: patternData } = await supabase
      .from('patterns')
      .select('*')
      .eq('id', project.pattern_id)
      .single()
    pattern = patternData ?? null

    // Generate signed URL for uploaded pattern files
    if (pattern?.file_path) {
      const { url } = await getSignedUrl('pattern-files', pattern.file_path)
      patternFileUrl = url
    }
  }

  return (
    <ProjectDashboard
      project={project}
      pattern={pattern}
      patternFileUrl={patternFileUrl}
      activeSession={activeSession}
      totalDurationSeconds={totalDurationSeconds}
      counters={counters ?? []}
      notes={notes ?? []}
    />
  )
}
