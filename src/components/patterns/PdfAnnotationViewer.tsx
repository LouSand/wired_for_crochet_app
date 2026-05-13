'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { AnnotationStroke } from '@/types/database'
import { saveAnnotations, getAllAnnotations } from '@/lib/actions/pattern-annotations'

interface PdfAnnotationViewerProps {
  pdfUrl: string
  projectId: string
  patternId: string
  patternTitle: string
  fileType?: 'pdf' | 'image'
}

type Tool = 'pan' | 'freehand' | 'highlight' | 'eraser' | 'text'

export default function PdfAnnotationViewer({
  pdfUrl,
  projectId,
  patternId,
  patternTitle,
  fileType = 'pdf',
}: PdfAnnotationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [tool, setTool] = useState<Tool>('pan')
  const [color, setColor] = useState('#fef08a')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([])
  const [annotations, setAnnotations] = useState<Record<number, AnnotationStroke[]>>({})
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)

  // Load PDF.js and the document, or load image
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      setLoading(true)
      try {
        const pdfjsLib = await import('pdfjs-dist')
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

        const doc = await pdfjsLib.getDocument(pdfUrl).promise
        if (!cancelled) {
          setPdfDoc(doc)
          setNumPages(doc.numPages)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load PDF:', err)
        setLoading(false)
      }
    }

    async function loadImage() {
      setLoading(true)
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          if (!cancelled) {
            setPdfDoc(img)
            setNumPages(1)
            setLoading(false)
          }
        }
        img.onerror = () => {
          console.error('Failed to load image')
          if (!cancelled) setLoading(false)
        }
        img.src = pdfUrl
      } catch {
        setLoading(false)
      }
    }

    if (fileType === 'pdf') {
      loadPdf()
    } else {
      loadImage()
    }
    return () => { cancelled = true }
  }, [pdfUrl, fileType])

  // Load saved annotations from DB
  useEffect(() => {
    async function loadAnnotations() {
      const { data } = await getAllAnnotations(projectId, patternId)
      if (data) {
        setAnnotations(data)
      }
    }
    loadAnnotations()
  }, [projectId, patternId])

  // Render current page (PDF) or image
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    async function renderPage() {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!

      if (fileType === 'image') {
        // Render image to canvas
        const img = pdfDoc as HTMLImageElement
        const w = Math.round(img.naturalWidth * scale)
        const h = Math.round(img.naturalHeight * scale)
        canvas.width = w
        canvas.height = h
        if (overlayRef.current) {
          overlayRef.current.width = w
          overlayRef.current.height = h
        }
        ctx.drawImage(img, 0, 0, w, h)
      } else {
        // Render PDF page
        const doc = pdfDoc as { getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number }; render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> }
        const page = await doc.getPage(currentPage)
        const viewport = page.getViewport({ scale })
        canvas.width = viewport.width
        canvas.height = viewport.height
        if (overlayRef.current) {
          overlayRef.current.width = viewport.width
          overlayRef.current.height = viewport.height
        }
        await page.render({ canvasContext: ctx, viewport }).promise
      }

      // Redraw annotations for this page
      redrawAnnotations()
    }

    renderPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale, fileType])

  // Redraw annotations whenever they change
  const redrawAnnotations = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')!
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const pageAnnotations = annotations[currentPage] ?? []
    for (const stroke of pageAnnotations) {
      if ((stroke.type === 'freehand' || stroke.type === 'highlight') && stroke.points && stroke.points.length > 1) {
        ctx.beginPath()
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = stroke.opacity
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      } else if (stroke.type === 'highlight' && stroke.rect) {
        // Legacy rect-based highlights
        ctx.fillStyle = stroke.color
        ctx.globalAlpha = stroke.opacity
        ctx.fillRect(stroke.rect.x, stroke.rect.y, stroke.rect.w, stroke.rect.h)
        ctx.globalAlpha = 1
      } else if (stroke.type === 'text' && stroke.points && stroke.points.length > 0 && stroke.text) {
        ctx.font = `bold ${stroke.fontSize ?? 16}px sans-serif`
        ctx.fillStyle = stroke.color
        ctx.globalAlpha = stroke.opacity
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y)
        ctx.globalAlpha = 1
      }
    }
  }, [annotations, currentPage])

  useEffect(() => {
    redrawAnnotations()
  }, [redrawAnnotations])

  // Drawing handlers
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const overlay = overlayRef.current
    if (!overlay) return null
    const rect = overlay.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }
    // Map from display coordinates to canvas internal coordinates
    const x = ((clientX - rect.left) / rect.width) * overlay.width
    const y = ((clientY - rect.top) / rect.height) * overlay.height
    return { x, y }
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'pan') return
    if ('touches' in e) e.preventDefault()
    const point = getCanvasPoint(e)
    if (!point) return

    if (tool === 'text') {
      setTextPosition(point)
      return
    }

    setIsDrawing(true)
    setCurrentStroke([point])

    if (tool === 'eraser') {
      eraseAt(point)
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'pan') return
    if ('touches' in e) e.preventDefault()
    const point = getCanvasPoint(e)
    if (!point) return

    if (tool === 'eraser') {
      eraseAt(point)
      return
    }

    setCurrentStroke((prev) => [...prev, point])

    // Draw live preview
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')!

    // Redraw existing annotations + current stroke
    redrawAnnotations()

    if (currentStroke.length > 0) {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = tool === 'highlight' ? strokeWidth * 4 : strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = tool === 'highlight' ? 0.35 : 1
      const allPoints = [...currentStroke, point]
      ctx.moveTo(allPoints[0].x, allPoints[0].y)
      for (let i = 1; i < allPoints.length; i++) {
        ctx.lineTo(allPoints[i].x, allPoints[i].y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if ((tool === 'freehand' || tool === 'highlight') && currentStroke.length > 1) {
      const newStroke: AnnotationStroke = {
        id: crypto.randomUUID(),
        type: tool,
        color,
        width: tool === 'highlight' ? strokeWidth * 4 : strokeWidth,
        opacity: tool === 'highlight' ? 0.35 : 1,
        points: currentStroke,
      }

      setAnnotations((prev) => ({
        ...prev,
        [currentPage]: [...(prev[currentPage] ?? []), newStroke],
      }))
      setDirty(true)
    }

    setCurrentStroke([])
  }

  const eraseAt = (point: { x: number; y: number }) => {
    const pageAnns = annotations[currentPage] ?? []
    const threshold = 20

    const filtered = pageAnns.filter((stroke) => {
      if (stroke.points) {
        return !stroke.points.some(
          (p) => Math.abs(p.x - point.x) < threshold && Math.abs(p.y - point.y) < threshold
        )
      }
      return true
    })

    if (filtered.length !== pageAnns.length) {
      setAnnotations((prev) => ({ ...prev, [currentPage]: filtered }))
      setDirty(true)
      redrawAnnotations()
    }
  }

  // Place text annotation
  const handlePlaceText = () => {
    if (!textPosition || !textInput.trim()) return
    const newStroke: AnnotationStroke = {
      id: crypto.randomUUID(),
      type: 'text',
      color,
      width: strokeWidth,
      opacity: 1,
      text: textInput.trim(),
      fontSize: 16 * (scale > 1 ? 1 : scale),
      points: [textPosition],
    }
    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] ?? []), newStroke],
    }))
    setDirty(true)
    setTextInput('')
    setTextPosition(null)
  }

  // Save annotations to DB
  const handleSave = async () => {
    setSaving(true)
    const pageAnns = annotations[currentPage] ?? []
    await saveAnnotations(projectId, patternId, currentPage, pageAnns)
    setDirty(false)
    setSaving(false)
  }

  // Save all pages
  const handleSaveAll = async () => {
    setSaving(true)
    const pages = Object.keys(annotations).map(Number)
    for (const page of pages) {
      await saveAnnotations(projectId, patternId, page, annotations[page])
    }
    setDirty(false)
    setSaving(false)
  }

  // Clear current page annotations
  const handleClearPage = () => {
    setAnnotations((prev) => ({ ...prev, [currentPage]: [] }))
    setDirty(true)
    const overlay = overlayRef.current
    if (overlay) {
      const ctx = overlay.getContext('2d')!
      ctx.clearRect(0, 0, overlay.width, overlay.height)
    }
  }

  // Undo last stroke on current page
  const handleUndo = () => {
    const pageAnns = annotations[currentPage] ?? []
    if (pageAnns.length === 0) return
    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: pageAnns.slice(0, -1),
    }))
    setDirty(true)
  }

  const colors = [
    { value: '#fef08a', label: 'Yellow' },
    { value: '#bbf7d0', label: 'Green' },
    { value: '#bfdbfe', label: 'Blue' },
    { value: '#fecaca', label: 'Red' },
    { value: '#e9d5ff', label: 'Purple' },
    { value: '#000000', label: 'Black' },
    { value: '#ef4444', label: 'Red pen' },
  ]

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 text-center">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-[300px] bg-gray-100 rounded" />
        </div>
        <p className="mt-4 text-sm text-gray-500">Loading PDF...</p>
      </div>
    )
  }

  if (!pdfDoc) {
    return (
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-red-600">Failed to load PDF. Try refreshing the page.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span className="text-sm font-semibold text-gray-800 truncate">{patternTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-[10px] text-amber-600 font-medium">Unsaved changes</span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || !dirty}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[32px]"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1">
          <ToolButton active={tool === 'pan'} onClick={() => setTool('pan')} label="Pan">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 5a2 2 0 012-2h0a2 2 0 012 2v4a2 2 0 012-2h0a2 2 0 012 2v7a6 6 0 01-6 6h-1a6 6 0 01-6-6v-3a2 2 0 012-2h0a2 2 0 012 2v0a2 2 0 012-2h0a2 2 0 012 2V5z" />
            </svg>
          </ToolButton>
          <ToolButton active={tool === 'freehand'} onClick={() => setTool('freehand')} label="Draw">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </ToolButton>
          <ToolButton active={tool === 'highlight'} onClick={() => setTool('highlight')} label="Highlight">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </ToolButton>
          <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} label="Eraser">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83a1.125 1.125 0 011.59 0l6.375 6.375a1.125 1.125 0 010 1.59L10.83 19.17a1.125 1.125 0 01-1.59 0z" />
            </svg>
          </ToolButton>
          <ToolButton active={tool === 'text'} onClick={() => setTool('text')} label="Text">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </ToolButton>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`h-6 w-6 rounded-full border-2 transition-all min-h-[24px] min-w-[24px] ${
                color === c.value ? 'border-gray-800 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: c.value }}
              aria-label={c.label}
              title={c.label}
            />
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-500" htmlFor="stroke-width">Size:</label>
          <input
            id="stroke-width"
            type="range"
            min={1}
            max={12}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-16 h-5"
          />
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Actions */}
        <button
          type="button"
          onClick={handleUndo}
          className="text-xs text-gray-600 hover:text-gray-800 font-medium min-h-[32px] px-2"
          title="Undo last stroke"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={handleClearPage}
          className="text-xs text-red-600 hover:text-red-700 font-medium min-h-[32px] px-2"
        >
          Clear page
        </button>
      </div>

      {/* Page navigation — only for multi-page PDFs */}
      {numPages > 1 && (
      <div className="flex items-center justify-center gap-3 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 min-h-[36px] min-w-[36px]"
          aria-label="Previous page"
        >
          ←
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page {currentPage} of {numPages}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 min-h-[36px] min-w-[36px]"
          aria-label="Next page"
        >
          →
        </button>

        <div className="h-5 w-px bg-gray-200 mx-2" />

        {/* Zoom */}
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-600 hover:bg-gray-100 min-h-[36px] min-w-[36px]"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="text-xs text-gray-600 min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-600 hover:bg-gray-100 min-h-[36px] min-w-[36px]"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      )}

      {/* Zoom only — for single page images */}
      {numPages <= 1 && (
      <div className="flex items-center justify-center gap-3 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-600 hover:bg-gray-100 min-h-[36px] min-w-[36px]"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="text-xs text-gray-600 min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-600 hover:bg-gray-100 min-h-[36px] min-w-[36px]"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      )}

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="overflow-auto bg-gray-100 max-h-[600px] flex justify-center"
        style={{ touchAction: tool === 'pan' ? 'auto' : 'none' }}
      >
        <div className="relative inline-block">
          <canvas ref={canvasRef} className="block" />
          <canvas
            ref={overlayRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{
              cursor: tool === 'pan' ? 'grab' : 'crosshair',
              pointerEvents: tool === 'pan' ? 'none' : 'auto',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        </div>
      </div>

      {/* Text input popup */}
      {textPosition && tool === 'text' && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-white">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your note..."
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handlePlaceText() }}
          />
          <button
            type="button"
            onClick={handlePlaceText}
            disabled={!textInput.trim()}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[32px]"
          >
            Place
          </button>
          <button
            type="button"
            onClick={() => { setTextPosition(null); setTextInput('') }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 min-h-[32px]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Tool Button ─────────────────────────────────────────────────────────────

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all min-h-[36px] min-w-[36px] ${
        active
          ? 'border-purple-500 bg-purple-100 text-purple-700'
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
      }`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
