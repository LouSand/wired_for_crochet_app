'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getInspirationGallery, toggleLike, type SharedProject } from '@/lib/actions/sharing'

export default function InspirationPage() {
  const [projects, setProjects] = useState<SharedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [craftFilter, setCraftFilter] = useState<string>('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await getInspirationGallery({ craft_type: craftFilter || undefined })
      setProjects(data)
      setLoading(false)
    }
    load()
  }, [craftFilter])

  const handleLike = async (id: string) => {
    await toggleLike(id)
    // Refresh
    const { data } = await getInspirationGallery({ craft_type: craftFilter || undefined })
    setProjects(data)
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return null
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspiration</h1>
          <p className="mt-1 text-sm text-gray-600">Finished projects shared by the community. Get inspired!</p>
        </div>
        <select
          value={craftFilter}
          onChange={(e) => setCraftFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All crafts</option>
          <option value="crochet">Crochet</option>
          <option value="knitting">Knitting</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-gray-900">No shared projects yet</p>
          <p className="mt-2 text-sm text-gray-500">Be the first to share a finished project!</p>
          <Link href="/projects" className="mt-4 inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            Go to Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Photo placeholder */}
              <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <svg className="h-12 w-12 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>

              <div className="p-4">
                {project.caption && (
                  <p className="text-sm text-gray-800 line-clamp-2">{project.caption}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  {project.craft_type && <span className="capitalize">{project.craft_type}</span>}
                  {project.time_taken_seconds && <span>⏱ {formatTime(project.time_taken_seconds)}</span>}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleLike(project.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    ❤️ {project.likes_count}
                  </button>
                  <div className="flex items-center gap-3">
                    {project.pattern_id && (
                      <Link href={`/projects/new?pattern_id=${project.pattern_id}`} className="text-xs text-green-600 hover:text-green-700">
                        I made this too
                      </Link>
                    )}
                    {project.pattern_id && (
                      <Link href={`/patterns/${project.pattern_id}`} className="text-xs text-purple-600 hover:text-purple-700">
                        View pattern →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
