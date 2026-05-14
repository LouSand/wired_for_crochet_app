'use client'

import { useState, useRef, useCallback } from 'react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onCancel: () => void
}

/**
 * Camera capture component for photographing patterns.
 * Uses the MediaDevices API to access the rear camera on mobile.
 * Falls back to file input on devices without camera access.
 */
export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const startCamera = useCallback(async () => {
    setStarting(true)
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Could not access camera. Please use the file upload option instead.')
    } finally {
      setStarting(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCaptured(dataUrl)
    stopCamera()
  }

  const handleAccept = () => {
    if (!captured || !canvasRef.current) return

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `pattern-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(file)
        }
      },
      'image/jpeg',
      0.85
    )
  }

  const handleRetake = () => {
    setCaptured(null)
    startCamera()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <h2 className="text-sm font-medium text-white">Capture Pattern</h2>
        <button
          type="button"
          onClick={() => { stopCamera(); onCancel() }}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10"
          aria-label="Close camera"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera view or captured image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-center px-6 space-y-4">
            <p className="text-sm text-red-400">{error}</p>
            <label className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700 cursor-pointer min-h-[48px]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Choose from gallery
              <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            </label>
          </div>
        ) : captured ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={captured} alt="Captured pattern" className="max-w-full max-h-full object-contain" />
        ) : stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-center px-6 space-y-4">
            <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            </svg>
            <p className="text-sm text-gray-400">Take a photo of your pattern for easy reference</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={starting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 min-h-[48px]"
              >
                {starting ? 'Starting camera...' : 'Open Camera'}
              </button>
              <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 cursor-pointer min-h-[48px]">
                Choose from gallery
                <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {stream && !captured && (
        <div className="flex items-center justify-center py-6 bg-black/80">
          <button
            type="button"
            onClick={takePhoto}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all"
            aria-label="Take photo"
          >
            <div className="h-12 w-12 rounded-full bg-white" />
          </button>
        </div>
      )}

      {captured && (
        <div className="flex items-center justify-center gap-4 py-6 bg-black/80">
          <button
            type="button"
            onClick={handleRetake}
            className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 min-h-[48px]"
          >
            Retake
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 min-h-[48px]"
          >
            Use Photo
          </button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
