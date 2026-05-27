'use client'

import { useEffect } from 'react'
import Text from '@/components/shared/text/Text'

export default function ImagePreviewModal({
  open,
  onClose,
  src,
  alt = 'Preview image',
  title = 'Image preview',
}) {
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

  if (!open || !src) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] w-auto max-w-[95vw] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-background-soft/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
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

        {/* IMAGE AREA */}
        <div className="flex min-h-0 items-center justify-center p-3">
          <img
            src={src}
            alt={alt}
            className="block max-h-[80vh] w-auto max-w-full rounded-[20px] object-contain shadow-xl"
          />
        </div>
      </div>
    </div>
  )
}
