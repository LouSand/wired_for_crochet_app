import { notFound } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getPhotos } from '@/lib/actions/photos'
import PhotoGrid from '@/components/photos/PhotoGrid'

const PhotoUploader = dynamic(
  () => import('@/components/photos/PhotoUploader'),
  {
    loading: () => (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        <p className="mt-2 text-sm text-gray-400">Loading uploader...</p>
      </div>
    ),
  }
)

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: photos, error } = await getPhotos(id)

  if (error && !photos) {
    notFound()
  }

  const photoList = photos ?? []

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
        <h1 className="text-2xl font-bold text-gray-900">Progress Photos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Document your progress with photos
        </p>
      </div>

      {/* Upload section */}
      <PhotoUploader projectId={id} />

      {/* Photo grid - chronological (oldest first) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Photos ({photoList.length})
        </h2>
        <PhotoGrid photos={photoList} />
      </div>
    </div>
  )
}
