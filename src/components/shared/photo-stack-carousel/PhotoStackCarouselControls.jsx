'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import Photo from '@/components/shared/photo/Photo'

export function usePhotoStackCarousel({
  mainSrc = '',
  extraSrcs = [],
  resetKey = '',
}) {
  const extras = useMemo(
    () =>
      (Array.isArray(extraSrcs) ? extraSrcs : [])
        .map((src) => String(src || '').trim())
        .filter(Boolean),
    [extraSrcs],
  )

  const hasExtras = extras.length > 0
  const maxStep = extras.length
  const [step, setStep] = useState(0)

  const extrasKey = extras.join('|')

  useEffect(() => {
    setStep(0)
  }, [resetKey, mainSrc, extrasKey])

  const safeStep = hasExtras ? Math.min(Math.max(step, 0), maxStep) : 0
  const displaySrc =
    !hasExtras || safeStep === 0 ? mainSrc : extras[safeStep - 1] || mainSrc
  const remainingExtras = hasExtras ? extras.slice(safeStep) : []
  const stackSrcs =
    remainingExtras.length > 0
      ? remainingExtras
      : hasExtras && mainSrc
        ? [mainSrc]
        : []

  return {
    hasExtras,
    maxStep,
    safeStep,
    displaySrc,
    stackSrcs,
    canGoLeft: hasExtras && safeStep > 0,
    canGoRight: hasExtras && safeStep < maxStep,
    goLeft: () => setStep((current) => Math.max(0, current - 1)),
    goRight: () => setStep((current) => Math.min(maxStep, current + 1)),
  }
}

export function PhotoStackDetailCards({ stackSrcs = [] }) {
  if (!stackSrcs.length) return null

  return (
    <div className="pointer-events-none absolute bottom-[14%] right-3 z-[3] w-[28%] sm:bottom-4 sm:right-4">
      <div className="relative aspect-[4/5] w-full">
        {stackSrcs.map((stackSrc, index) => {
          const offset = index * 7

          return (
            <div
              key={`${stackSrc}-${index}`}
              className="absolute inset-0 overflow-hidden rounded-2xl border border-white/25 bg-white shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
              style={{
                zIndex: stackSrcs.length - index,
                transform: `translate(${-offset}px, ${-offset}px)`,
              }}
            >
              <div className="relative h-full w-full">
                <Photo
                  src={stackSrc}
                  alt={`Extra photo ${index + 1}`}
                  fill
                  sizes="120px"
                  className="!object-cover object-center"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PhotoStackNavButtons({
  canGoLeft,
  canGoRight,
  onLeft,
  onRight,
}) {
  return (
    <>
      <button
        type="button"
        aria-disabled={!canGoLeft}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!canGoLeft) return
          onLeft?.()
        }}
        aria-label="Previous photo"
        className={clsx(
          'absolute left-3 top-1/2 z-[4] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)] backdrop-blur-sm transition sm:left-4 sm:h-9 sm:w-9',
          canGoLeft
            ? 'hover:border-white/25 hover:bg-black/70'
            : 'cursor-default opacity-35',
        )}
      >
        <ChevronLeft size={18} />
      </button>

      <button
        type="button"
        aria-disabled={!canGoRight}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!canGoRight) return
          onRight?.()
        }}
        aria-label="Next photo"
        className={clsx(
          'absolute right-3 top-1/2 z-[4] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)] backdrop-blur-sm transition sm:right-4 sm:h-9 sm:w-9',
          canGoRight
            ? 'hover:border-white/25 hover:bg-black/70'
            : 'cursor-default opacity-35',
        )}
      >
        <ChevronRight size={18} />
      </button>
    </>
  )
}

export default function PhotoStackCarouselOverlay({
  mainSrc = '',
  extraSrcs = [],
  resetKey = '',
  children,
}) {
  const carousel = usePhotoStackCarousel({ mainSrc, extraSrcs, resetKey })

  return children({
    ...carousel,
    controls: carousel.hasExtras ? (
      <>
        <PhotoStackNavButtons
          canGoLeft={carousel.canGoLeft}
          canGoRight={carousel.canGoRight}
          onLeft={carousel.goLeft}
          onRight={carousel.goRight}
        />
        <PhotoStackDetailCards stackSrcs={carousel.stackSrcs} />
      </>
    ) : null,
  })
}
