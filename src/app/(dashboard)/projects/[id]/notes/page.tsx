import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getNotes, type NoteCategory } from '@/lib/actions/notes'
import NoteForm from '@/components/notes/NoteForm'
import NoteList from '@/components/notes/NoteList'
import NoteCategoryTabs from '@/components/notes/NoteCategoryTabs'

const VALID_CATEGORIES: NoteCategory[] = ['general', 'remember_next_time', 'pattern_alteration']

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const { category } = await searchParams

  // Validate category filter
  const categoryFilter = typeof category === 'string' && VALID_CATEGORIES.includes(category as NoteCategory)
    ? (category as NoteCategory)
    : undefined

  const { data: notes, error } = await getNotes(id, categoryFilter)

  if (error && !notes) {
    notFound()
  }

  const noteList = notes ?? []

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
        <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep track of important details, alterations, and things to remember
        </p>
      </div>

      {/* Create note form */}
      <NoteForm projectId={id} />

      {/* Category tabs */}
      <NoteCategoryTabs activeCategory={categoryFilter ?? ''} />

      {/* Notes list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Notes ({noteList.length})
        </h2>
        <NoteList notes={noteList} />
      </div>
    </div>
  )
}
