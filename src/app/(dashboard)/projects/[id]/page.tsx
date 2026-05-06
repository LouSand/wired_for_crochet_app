import { notFound } from 'next/navigation'
import { getProject } from '@/lib/actions/projects'
import { getTimeSessions, getActiveSession } from '@/lib/actions/time-sessions'
import { getCounters } from '@/lib/actions/counters'
import { createClient } from '@/lib/supabase/server'
import ProjectDashboard from './ProjectDashboard'

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
  ] = await Promise.all([
    getProject(id),
    getTimeSessions(id),
    getActiveSession(id),
    getCounters(id),
  ])

  if (error || !project) {
    notFound()
  }

  // Fetch linked pattern title if pattern_id is set
  let patternTitle: string | null = null
  if (project.pattern_id) {
    const supabase = await createClient()
    const { data: pattern } = await supabase
      .from('patterns')
      .select('title')
      .eq('id', project.pattern_id)
      .single()
    patternTitle = pattern?.title ?? null
  }

  return (
    <ProjectDashboard
      project={project}
      patternTitle={patternTitle}
      activeSession={activeSession}
      totalDurationSeconds={totalDurationSeconds}
      counters={counters ?? []}
    />
  )
}
