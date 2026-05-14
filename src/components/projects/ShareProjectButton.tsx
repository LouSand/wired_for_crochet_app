'use client'

import { useState } from 'react'
import { shareProject } from '@/lib/actions/sharing'

interface ShareProjectButtonProps {
  projectId: string
  projectName: string
}

export default function ShareProjectButton({ projectId, projectName }: ShareProjectButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [caption, setCaption] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    setSharing(true)
    setError(null)
    const { error: err } = await shareProject(projectId, caption || `Finished: ${projectName}`)
    if (err) setError(err)
    else setShared(true)
    setSharing(false)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/inspiration`
    navigator.clipboard.writeText(url)
  }

  const handleShareSocial = (platform: string) => {
    const text = encodeURIComponent(caption || `Just finished my crochet project: ${projectName}! 🧶`)
    const url = encodeURIComponent(`${window.location.origin}/inspiration`)

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`,
    }

    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  if (shared) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-green-700 font-medium">✓ Shared to inspiration gallery!</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => handleShareSocial('twitter')} className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600">Share on X</button>
          <button type="button" onClick={() => handleShareSocial('facebook')} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Share on Facebook</button>
          <button type="button" onClick={() => handleShareSocial('pinterest')} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Share on Pinterest</button>
          <button type="button" onClick={handleCopyLink} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Copy Link</button>
        </div>
      </div>
    )
  }

  if (showModal) {
    return (
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-purple-900">Share to Inspiration Gallery</h4>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={`Finished: ${projectName}! Add a caption...`}
          rows={2}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={handleShare} disabled={sharing} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
            {sharing ? 'Sharing...' : 'Share'}
          </button>
          <button type="button" onClick={() => setShowModal(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowModal(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 active:bg-purple-100 min-h-[44px]"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
      Share
    </button>
  )
}
