import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getHookUsagesForProject, getHookEntries } from '@/lib/actions/hooks'
import ProjectHookSection from '@/components/hooks/ProjectHookSection'

export default async function ProjectHooksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [usagesResult, entriesResult] = await Promise.all([
    getHookUsagesForProject(id),
    getHookEntries(),
  ])

  if (usagesResult.error && !usagesResult.data) {
    notFound()
  }

  const hookUsages = usagesResult.data ?? []
  const allHookEntries = entriesResult.data ?? []

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href={`/projects/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← Back to project
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Hooks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage hooks linked to this project from your collection
        </p>
      </div>

      {/* Hook section */}
      <ProjectHookSection
        projectId={id}
        hookUsages={hookUsages}
        allHookEntries={allHookEntries}
      />
    </div>
  )
}
