import { notFound } from 'next/navigation'
import { getProject } from '@/lib/actions/projects'
import { createClient } from '@/lib/supabase/server'
import ProjectDetailClient from './ProjectDetailClient'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: project, error } = await getProject(id)

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

  return <ProjectDetailClient project={project} patternTitle={patternTitle} />
}
