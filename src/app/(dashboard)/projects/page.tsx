import { Suspense } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/actions/projects'
import FilterBar from '@/components/ui/FilterBar'
import ProjectCard from '@/components/projects/ProjectCard'
import EmptyState from '@/components/ui/EmptyState'
import DeadlineNotifications from '@/components/projects/DeadlineNotifications'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const status = typeof params.status === 'string' ? params.status : undefined
  const difficulty = typeof params.difficulty === 'string' ? params.difficulty : undefined
  const sortBy = typeof params.sortBy === 'string'
    ? (params.sortBy as 'date_started' | 'status' | 'difficulty' | 'created_at')
    : undefined
  const sortDirection = typeof params.sortDirection === 'string'
    ? (params.sortDirection as 'asc' | 'desc')
    : undefined

  const { data: projects, error } = await getProjects({
    status,
    difficulty,
    sortBy,
    sortDirection,
  })

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link
          href="/projects/new"
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Deadline notifications */}
      {!error && projects && projects.length > 0 && (
        <div className="mt-6">
          <DeadlineNotifications projects={projects} />
        </div>
      )}

      {/* Filter bar */}
      <div className="mt-6">
        <Suspense fallback={null}>
          <FilterBar />
        </Suspense>
      </div>

      {/* Project grid */}
      <div className="mt-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!error && projects && projects.length === 0 && (
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            }
            title="No projects yet"
            description="Get started by creating your first crochet project."
            actionLabel="New Project"
            actionHref="/projects/new"
          />
        )}

        {!error && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
