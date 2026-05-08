import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getYarnUsagesForProject, getYarnEntries } from '@/lib/actions/yarn'
import ProjectYarnSection from '@/components/yarn/ProjectYarnSection'

export default async function ProjectYarnPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [usagesResult, entriesResult] = await Promise.all([
    getYarnUsagesForProject(id),
    getYarnEntries(),
  ])

  if (usagesResult.error && !usagesResult.data) {
    notFound()
  }

  const yarnUsages = usagesResult.data ?? []
  const allYarnEntries = entriesResult.data ?? []

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
        <h1 className="text-2xl font-bold text-gray-900">Project Yarn</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage yarn linked to this project from your inventory
        </p>
      </div>

      {/* Yarn section */}
      <ProjectYarnSection
        projectId={id}
        yarnUsages={yarnUsages}
        allYarnEntries={allYarnEntries}
      />
    </div>
  )
}
