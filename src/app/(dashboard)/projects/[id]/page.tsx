import { notFound } from 'next/navigation'
import { getProject } from '@/lib/actions/projects'
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

  return <ProjectDetailClient project={project} />
}
