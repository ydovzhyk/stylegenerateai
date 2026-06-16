'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function roundZoom(value) {
  return Math.round(value * 100) / 100
}

export default function ImagePreviewModal({
  open,
  onClose,
  src,
  alt = 'Preview image',
  title = 'Image preview',
}) {
  const viewportRef = useRef(null)
  const imageRef = useRef(null)

  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  })

  const resetView = useCallback(() => {
    setZoom(MIN_ZOOM)
    setPan({ x: 0, y: 0 })
  }, [])

  const clampPan = useCallback((nextPan, nextZoom = zoom) => {
    const viewport = viewportRef.current
    const image = imageRef.current

    if (!viewport || !image || nextZoom <= MIN_ZOOM) {
      return { x: 0, y: 0 }
    }

    const viewportRect = viewport.getBoundingClientRect()
    const baseWidth = image.offsetWidth
    const baseHeight = image.offsetHeight

    if (!baseWidth || !baseHeight) return nextPan

    const scaledWidth = baseWidth * nextZoom
    const scaledHeight = baseHeight * nextZoom

    const maxX = Math.max(0, (scaledWidth - viewportRect.width) / 2)
    const maxY = Math.max(0, (scaledHeight - viewportRect.height) / 2)

    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    }
  }, [zoom])

  const updateZoom = useCallback(
    (value) => {
      const nextZoom = roundZoom(clamp(value, MIN_ZOOM, MAX_ZOOM))
      setZoom(nextZoom)
      setPan((current) => clampPan(current, nextZoom))
    },
    [clampPan],
  )

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      resetView()
    }
  }, [open, resetView])

  useEffect(() => {
    resetView()
  }, [src, resetView])

  useEffect(() => {
    if (!open) return

    const handlePointerMove = (event) => {
      const drag = dragStateRef.current
      if (!drag.active) return

      const deltaX = event.clientX - drag.startX
      const deltaY = event.clientY - drag.startY

      setPan(
        clampPan({
          x: drag.panX + deltaX,
          y: drag.panY + deltaY,
        }),
      )
    }

    const stopDragging = () => {
      dragStateRef.current.active = false
      dragStateRef.current.pointerId = null
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [open, clampPan])

  const handlePointerDown = (event) => {
    if (zoom <= MIN_ZOOM) return
    if (event.button !== 0) return

    event.preventDefault()

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }

    setIsDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  if (!open || !src) return null

  const zoomPercent = Math.round(zoom * 100)
  const canPan = zoom > MIN_ZOOM

  return (
    <div
      className={MODAL_OVERLAY_CLASS}
      onClick={onClose}
    >
      <div
        className="gradient-border-card relative z-10 flex max-h-[95vh] w-[min(95vw,1100px)] flex-col overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.42),0_0_60px_rgba(124,92,255,0.12)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/22 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,92,255,0.12)_0%,transparent_58%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(0,213,255,0.08)_0%,transparent_50%)]" />
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
          <Text as="h3" variant="body" color="white" caseMode="sentence">
            {title}
          </Text>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 backdrop-blur-md transition hover:bg-black/40 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div
          ref={viewportRef}
          className={`relative z-10 min-h-[320px] flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(124,92,255,0.07)_0%,rgba(11,13,18,0.72)_48%,rgba(0,213,255,0.06)_100%)] sm:min-h-[420px] ${
            canPan
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-default'
          }`}
          onPointerDown={handlePointerDown}
        >
          <div className="flex h-[min(72vh,760px)] w-full items-center justify-center p-3">
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              draggable={false}
              onLoad={() => setPan((current) => clampPan(current, zoom))}
              className="max-h-full max-w-full select-none rounded-[20px] object-contain shadow-xl transition-transform duration-150 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Text
            as="p"
            variant="caption"
            color="muted"
            caseMode="sentence"
            className="hidden sm:block"
          >
            {canPan
              ? 'Drag the image to move it inside the preview.'
              : 'Use zoom controls to inspect image details.'}
          </Text>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => updateZoom(zoom - ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 transition hover:bg-black/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={16} />
            </button>

            <input
              type="range"
              min={MIN_ZOOM * 100}
              max={MAX_ZOOM * 100}
              step={ZOOM_STEP * 100}
              value={zoomPercent}
              onChange={(e) => updateZoom(Number(e.target.value) / 100)}
              aria-label="Zoom level"
              className="h-1.5 w-full min-w-[140px] max-w-[220px] cursor-pointer appearance-none rounded-full bg-white/10 accent-[#7c5cff] sm:w-[180px]"
            />

            <button
              type="button"
              onClick={() => updateZoom(zoom + ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 transition hover:bg-black/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={16} />
            </button>

            <span className="min-w-[48px] text-center text-xs font-medium text-white/70">
              {zoomPercent}%
            </span>

            <button
              type="button"
              onClick={resetView}
              disabled={zoom <= MIN_ZOOM && pan.x === 0 && pan.y === 0}
              aria-label="Reset zoom"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 transition hover:bg-black/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
