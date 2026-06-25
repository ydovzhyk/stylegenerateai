'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import GalleryImageCard from '@/components/gallery/GalleryImageCard'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'

function getScrollStep(container) {
  if (!container) return 320
  return Math.max(container.clientWidth * 0.72, 260)
}

export default function GallerySectionSlider({
  title,
  description = '',
  items = [],
  deleteLoadingId = null,
  onDelete,
  onPreview,
}) {
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const [isScrollable, setIsScrollable] = useState(false)

  const updateScrollable = useCallback(() => {
    const node = containerRef.current
    const trackNode = trackRef.current

    if (!node || !trackNode) {
      setIsScrollable(false)
      return
    }

    setIsScrollable(trackNode.scrollWidth > node.clientWidth + 2)
  }, [])

  useEffect(() => {
    updateScrollable()

    const node = containerRef.current
    const trackNode = trackRef.current

    if (!node || !trackNode) return

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateScrollable())
        : null

    if (resizeObserver) {
      resizeObserver.observe(node)
      resizeObserver.observe(trackNode)
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [items.length, updateScrollable])

  const handlePrev = useCallback(() => {
    const node = containerRef.current
    if (!node || !isScrollable) return

    node.scrollBy({
      left: -getScrollStep(node),
      behavior: 'smooth',
    })
  }, [isScrollable])

  const handleNext = useCallback(() => {
    const node = containerRef.current
    if (!node || !isScrollable) return

    node.scrollBy({
      left: getScrollStep(node),
      behavior: 'smooth',
    })
  }, [isScrollable])

  return (
    <section className="gradient-border-card overflow-hidden p-5 sm:p-6 lg:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <Text as="h3" variant="h3" color="white" caseMode="sentence">
            {title}
          </Text>

          {description ? (
            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-2"
            >
              {description}
            </Text>
          ) : null}
        </div>

        {items.length ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrev}
              disabled={!isScrollable}
              className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleNext}
              disabled={!isScrollable}
              className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        ) : null}
      </div>

      {items.length ? (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background/65 via-background/30 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background/65 via-background/30 to-transparent" />

          <div
            ref={containerRef}
            onScroll={updateScrollable}
            className="hide-scrollbar overflow-x-auto overflow-y-hidden"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div
              ref={trackRef}
              className={`flex w-max gap-4 ${
                items.length === 1 ? 'pr-0' : 'pr-4 sm:gap-5 sm:pr-5'
              }`}
            >
              {items.map((item) => (
                <GalleryImageCard
                  key={item._id}
                  item={item}
                  deleting={deleteLoadingId === item._id}
                  onDelete={onDelete}
                  onPreview={onPreview}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
          <Text as="p" variant="body-sm" color="muted" caseMode="sentence">
            No saved images in this section yet.
          </Text>
        </div>
      )}
    </section>
  )
}
