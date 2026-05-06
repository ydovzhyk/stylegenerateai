'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getCreateYourLookSearchParams,
  getHasMoreSearchResults,
  getReadyTemplateCategories,
  getYourLookSearchLoading,
  getYourLookSearchTemplates,
} from '@/store/ready-template/ready-template-selectors'
import { getYourLookSearchTemplates as getYourLookSearchTemplatesOperation } from '@/store/ready-template/ready-template-operations'
import {
  setCreateYourLookSearchParams,
  setSelectedYourLookTemplate,
} from '@/store/ready-template/ready-template-slice'

import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import { useTranslate } from '@/utils/translate/translate'

const AUTO_SCROLL_SPEED = 0.42
const LOAD_MORE_OFFSET = 520
const RESUME_DELAY_MS = 1400
const PROGRESS_THUMB_WIDTH = 28
const PROGRESS_APPEND_SMOOTH_MS = 900

function mapTemplateItem(item) {
  return {
    id: item?._id || item?.slug || String(item?.previewUrl || Math.random()),
    title: String(item?.title || '').trim(),
    category: String(item?.category || '').trim(),
    previewUrl: String(item?.previewUrl || '').trim(),
    slug: String(item?.slug || '').trim(),
  }
}

function getScrollStep(container) {
  if (!container) return 320
  return Math.max(container.clientWidth * 0.72, 260)
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getOriginalTrackWidth(trackNode, templatesCount) {
  if (!trackNode || !templatesCount) return 0
  const children = Array.from(trackNode.children).slice(0, templatesCount)
  if (!children.length) return 0
  const firstChild = children[0]
  const lastChild = children[children.length - 1]

  return lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft
}

function getLoopWidth(trackNode, templatesCount) {
  if (!trackNode || !templatesCount) return 0
  const children = Array.from(trackNode.children)
  const secondCopyFirstChild = children[templatesCount]

  if (secondCopyFirstChild) {
    return secondCopyFirstChild.offsetLeft
  }

  return getOriginalTrackWidth(trackNode, templatesCount)
}

function RailTemplateCard({ item, onPause, onResume, onSelect }) {
  const reducedMotion = useReducedMotion()

  if (!item?.previewUrl) return null

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(item)
        }
      }}
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
      className="group relative w-[calc(100vw-64px)] max-w-[360px] shrink-0 cursor-pointer overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:border-primary/30 sm:w-[300px] md:w-[320px] lg:w-[270px] xl:w-[280px]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-12%] h-28 w-28 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-12%] h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative aspect-[4/5] overflow-hidden">
        <motion.img
          src={item.previewUrl}
          alt={item.title}
          className="absolute inset-[-1px] h-[calc(100%+2px)] w-[calc(100%+2px)] object-cover object-[50%_5%]"
          whileHover={reducedMotion ? undefined : { scale: 1.045 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(3,6,18,0.9)_0%,rgba(3,6,18,0.24)_38%,rgba(3,6,18,0.05)_66%,rgba(3,6,18,0.02)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 z-[2] p-4">
          {item.category ? (
            <span className="mb-2 inline-flex rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary-soft backdrop-blur-sm">
              {item.category}
            </span>
          ) : null}

          <Text
            as="h3"
            variant="body"
            color="white"
            caseMode="sentence"
            className="line-clamp-2 pr-2"
          >
            {item.title}
          </Text>
        </div>
      </div>
    </motion.article>
  )
}

export default function CreateYourLookDefaultTemplatesRail() {
  const dispatch = useDispatch()
  const reducedMotion = useReducedMotion()
  const templatesRaw = useSelector(getYourLookSearchTemplates)
  const searchParams = useSelector(getCreateYourLookSearchParams)
  const loading = useSelector(getYourLookSearchLoading)
  const hasMore = useSelector(getHasMoreSearchResults)
  const categories = useSelector(getReadyTemplateCategories) || []

  const isSearchMode =
    searchParams.query ||
    (searchParams.selectedCategory && searchParams.selectedCategory !== 'All')

  const templates = useMemo(
    () =>
      (templatesRaw || [])
        .map(mapTemplateItem)
        .filter((item) => item.previewUrl),
    [templatesRaw],
  )

  const totalTemplates = useMemo(() => {
    return categories.reduce(
      (sum, item) => sum + Number(item?.templatesCount || 0),
      0,
    )
  }, [categories])

  const railText = useTranslate(
    isSearchMode
      ? `Found ${templatesRaw.length} templates matching your search`
      : `Explore ${totalTemplates || templates.length} curated templates and find the look that reflects your individuality best.`,
    { caseMode: 'sentence' },
  )

  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const progressTrackRef = useRef(null)
  const progressThumbRef = useRef(null)
  const firstTrackWidthRef = useRef(0)
  const frameRef = useRef(null)
  const resumeTimerRef = useRef(null)
  const progressSmoothTimerRef = useRef(null)
  const previousTemplatesCountRef = useRef(0)
  const isAppendingRef = useRef(false)
  const isDraggingProgressRef = useRef(false)
  const isProgressSmoothingRef = useRef(false)

  const [isHovered, setIsHovered] = useState(false)
  const [isPointerDown, setIsPointerDown] = useState(false)
  const [isScrollable, setIsScrollable] = useState(false)

  const shouldLoop = isScrollable && !hasMore && templates.length > 1

  const renderedTemplates = useMemo(() => {
    if (!shouldLoop) return templates
    return [...templates, ...templates]
  }, [templates, shouldLoop])

  const applyThumbOffset = useCallback((progressValue, smooth = false) => {
    const trackWidth = progressTrackRef.current?.clientWidth || 0
    const thumbNode = progressThumbRef.current
    if (!thumbNode || trackWidth <= 0) return

    const travel = Math.max(trackWidth - PROGRESS_THUMB_WIDTH, 0)
    const offset = progressValue * travel

    if (smooth || isProgressSmoothingRef.current) {
      thumbNode.style.transition = `transform ${PROGRESS_APPEND_SMOOTH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
    } else {
      thumbNode.style.transition = 'none'
    }

    thumbNode.style.transform = `translateX(${offset}px)`
  }, [])

  const getCurrentProgress = useCallback(() => {
    const node = containerRef.current
    if (!node) return 0

    let maxScrollable = node.scrollWidth - node.clientWidth
    let currentScrollLeft = node.scrollLeft

    if (shouldLoop && firstTrackWidthRef.current > 0) {
      maxScrollable = firstTrackWidthRef.current - node.clientWidth

      if (maxScrollable <= 0) return 0

      currentScrollLeft = currentScrollLeft % maxScrollable
    }

    if (maxScrollable <= 0) return 0

    return clamp(currentScrollLeft / maxScrollable, 0, 1)
  }, [shouldLoop])

  const pauseAutoScroll = useCallback(() => {
    setIsHovered(true)
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
  }, [])

  const resumeAutoScrollImmediately = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
    setIsHovered(false)
  }, [])

  const resumeAutoScrollWithDelay = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
    }

    resumeTimerRef.current = setTimeout(() => {
      setIsHovered(false)
    }, RESUME_DELAY_MS)
  }, [])

  const updateProgress = useCallback(() => {
    applyThumbOffset(getCurrentProgress())
  }, [applyThumbOffset, getCurrentProgress])

  const setScrollFromProgress = useCallback(
    (nextProgress, behavior = 'auto') => {
      const node = containerRef.current
      if (!node) return

      const safeProgress = clamp(nextProgress, 0, 1)

      let maxScrollable = node.scrollWidth - node.clientWidth
      if (shouldLoop && firstTrackWidthRef.current > 0) {
        maxScrollable = firstTrackWidthRef.current - node.clientWidth
      }

      const targetLeft = safeProgress * maxScrollable

      if (behavior === 'smooth') {
        node.scrollTo({ left: targetLeft, behavior: 'smooth' })
      } else {
        node.scrollLeft = targetLeft
      }

      applyThumbOffset(safeProgress)
    },
    [applyThumbOffset, shouldLoop],
  )

  const maybeLoadMore = useCallback(() => {
    const node = containerRef.current
    if (!node || loading || !hasMore || isAppendingRef.current) return

    const distanceToEnd =
      node.scrollWidth - (node.scrollLeft + node.clientWidth)

    if (distanceToEnd <= LOAD_MORE_OFFSET) {
      const nextPage = Number(searchParams?.page || 1) + 1

      isAppendingRef.current = true

      const nextParams = {
        ...searchParams,
        page: nextPage,
      }

      dispatch(setCreateYourLookSearchParams({ page: nextPage }))

      dispatch(
        getYourLookSearchTemplatesOperation({
          ...nextParams,
          mode: 'append',
        }),
      )
    }
  }, [dispatch, hasMore, loading, searchParams])

  useEffect(() => {
    if (!loading) {
      isAppendingRef.current = false
    }
  }, [loading])

  useEffect(() => {
    const previousCount = previousTemplatesCountRef.current
    const currentCount = templates.length

    if (previousCount > 0 && currentCount > previousCount) {
      isProgressSmoothingRef.current = true

      requestAnimationFrame(() => {
        applyThumbOffset(getCurrentProgress(), true)

        if (progressSmoothTimerRef.current) {
          clearTimeout(progressSmoothTimerRef.current)
        }

        progressSmoothTimerRef.current = setTimeout(() => {
          isProgressSmoothingRef.current = false

          const thumbNode = progressThumbRef.current
          if (thumbNode) {
            thumbNode.style.transition = 'none'
          }
        }, PROGRESS_APPEND_SMOOTH_MS + 80)
      })
    }

    previousTemplatesCountRef.current = currentCount
  }, [applyThumbOffset, getCurrentProgress, templates.length])

  useEffect(() => {
    const node = containerRef.current
    const trackNode = trackRef.current

    if (!node || !trackNode) return

    const measure = () => {
      const containerWidth = node.clientWidth
      const originalTrackWidth = getOriginalTrackWidth(
        trackNode,
        templates.length,
      )

      const scrollable = originalTrackWidth > containerWidth + 2
      setIsScrollable(scrollable)

      if (!scrollable) {
        firstTrackWidthRef.current = 0
        applyThumbOffset(0)
        node.scrollLeft = 0
        return
      }

      if (shouldLoop) {
        firstTrackWidthRef.current = getLoopWidth(trackNode, templates.length)
      } else {
        firstTrackWidthRef.current = 0
      }

      updateProgress()
    }

    measure()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => measure())
        : null

    if (resizeObserver) {
      resizeObserver.observe(node)
      resizeObserver.observe(trackNode)
      if (progressTrackRef.current) {
        resizeObserver.observe(progressTrackRef.current)
      }
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [
    applyThumbOffset,
    renderedTemplates,
    shouldLoop,
    templates.length,
    updateProgress,
  ])

  useEffect(() => {
    const node = containerRef.current
    const trackNode = trackRef.current

    if (!node || !trackNode || !shouldLoop) {
      firstTrackWidthRef.current = 0
      return
    }

    const loopWidth = getLoopWidth(trackNode, templates.length)
    firstTrackWidthRef.current = loopWidth

    if (loopWidth > 0) {
      node.scrollLeft = node.scrollLeft % loopWidth || 1
    }
  }, [renderedTemplates, shouldLoop, templates.length])

  const handlePrev = useCallback(() => {
    const node = containerRef.current
    if (!node || !isScrollable) return

    pauseAutoScroll()
    node.scrollBy({
      left: -getScrollStep(node),
      behavior: 'smooth',
    })
    resumeAutoScrollWithDelay()
  }, [isScrollable, pauseAutoScroll, resumeAutoScrollWithDelay])

  const handleNext = useCallback(() => {
    const node = containerRef.current
    if (!node || !isScrollable) return

    pauseAutoScroll()
    node.scrollBy({
      left: getScrollStep(node),
      behavior: 'smooth',
    })
    maybeLoadMore()
    resumeAutoScrollWithDelay()
  }, [isScrollable, maybeLoadMore, pauseAutoScroll, resumeAutoScrollWithDelay])

  useEffect(() => {
    if (reducedMotion || !isScrollable) return

    const node = containerRef.current
    if (!node) return

    let rafId = null

    const tick = () => {
      if (!node) return

      if (!isHovered && !isPointerDown && !isDraggingProgressRef.current) {
        node.scrollLeft += AUTO_SCROLL_SPEED

        if (shouldLoop && firstTrackWidthRef.current > 0) {
          if (node.scrollLeft >= firstTrackWidthRef.current) {
            node.scrollLeft -= firstTrackWidthRef.current
          }
        }

        maybeLoadMore()
        updateProgress()
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    frameRef.current = rafId

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [
    isHovered,
    isPointerDown,
    isScrollable,
    maybeLoadMore,
    reducedMotion,
    shouldLoop,
    updateProgress,
  ])

  useEffect(() => {
    updateProgress()
  }, [templates, isScrollable, updateProgress])

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      if (progressSmoothTimerRef.current) {
        clearTimeout(progressSmoothTimerRef.current)
      }
    }
  }, [])

  const handleScroll = useCallback(() => {
    const node = containerRef.current
    if (!node) return

    if (shouldLoop && firstTrackWidthRef.current > 0) {
      if (node.scrollLeft >= firstTrackWidthRef.current) {
        node.scrollLeft -= firstTrackWidthRef.current
      } else if (node.scrollLeft <= 0) {
        node.scrollLeft += firstTrackWidthRef.current
      }
    }

    maybeLoadMore()
    updateProgress()
  }, [maybeLoadMore, shouldLoop, updateProgress])

  const handleProgressPointerMove = useCallback(
    (clientX, isDrag = true) => {
      const trackNode = progressTrackRef.current
      if (!trackNode || !isScrollable) return

      const rect = trackNode.getBoundingClientRect()
      const trackWidth = rect.width
      if (trackWidth <= 0) return

      const rawX = clientX - rect.left
      const safeX = clamp(rawX, 0, trackWidth)
      const nextProgress = safeX / trackWidth

      setScrollFromProgress(nextProgress, isDrag ? 'auto' : 'smooth')
    },
    [isScrollable, setScrollFromProgress],
  )

  const handleProgressPointerDown = useCallback(
    (e) => {
      if (!isScrollable) return

      e.preventDefault()
      isDraggingProgressRef.current = true
      pauseAutoScroll()
      handleProgressPointerMove(e.clientX, true)

      const onMove = (event) => {
        handleProgressPointerMove(event.clientX, true)
      }

      const onUp = () => {
        isDraggingProgressRef.current = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        resumeAutoScrollWithDelay()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [
      handleProgressPointerMove,
      isScrollable,
      pauseAutoScroll,
      resumeAutoScrollWithDelay,
    ],
  )

  const handleSelectTemplate = useCallback(
    (item) => {
      if (!item?.id) return
      pauseAutoScroll()
      dispatch(setSelectedYourLookTemplate(item))
    },
    [dispatch, pauseAutoScroll],
  )

  if (!templates.length && !loading) return null

  return (
    <section className="gradient-border-card overflow-hidden p-5 sm:p-6 lg:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <Text as="h2" variant="h2" color="white" caseMode="sentence">
            Explore looks
          </Text>

          <Text
            as="p"
            variant="body"
            color="muted"
            caseMode="sentence"
            className="mt-3 max-w-[720px]"
          >
            {railText}
          </Text>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrev}
            className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
            aria-label="Scroll left"
            disabled={!isScrollable}
          >
            <ChevronLeft size={18} />
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleNext}
            className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
            aria-label="Scroll right"
            disabled={!isScrollable}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background/65 via-background/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background/65 via-background/30 to-transparent" />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          onMouseEnter={pauseAutoScroll}
          onMouseLeave={resumeAutoScrollImmediately}
          onPointerDown={() => {
            setIsPointerDown(true)
            pauseAutoScroll()
          }}
          onPointerUp={() => {
            setIsPointerDown(false)
            resumeAutoScrollWithDelay()
          }}
          onPointerCancel={() => {
            setIsPointerDown(false)
            resumeAutoScrollWithDelay()
          }}
          className="hide-scrollbar overflow-x-auto overflow-y-hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div
            ref={trackRef}
            className={`flex w-max gap-4 ${
              templates.length === 1 ? 'pr-0' : 'pr-4 sm:gap-5 sm:pr-5'
            }`}
          >
            {renderedTemplates.map((item, index) => (
              <RailTemplateCard
                key={`${item.id}-${index}`}
                item={item}
                onPause={pauseAutoScroll}
                onResume={resumeAutoScrollImmediately}
                onSelect={handleSelectTemplate}
              />
            ))}

            {loading ? (
              <>
                <div className="h-[300px] w-[calc(100vw-64px)] max-w-[360px] shrink-0 animate-pulse rounded-[26px] border border-white/8 bg-white/[0.03] sm:w-[300px] md:w-[320px] lg:w-[270px] xl:w-[280px]" />

                <div className="hidden h-[300px] w-[calc(100vw-64px)] max-w-[360px] shrink-0 animate-pulse rounded-[26px] border border-white/8 bg-white/[0.03] sm:block sm:w-[300px] md:w-[320px] lg:w-[270px] xl:w-[280px]" />
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 pl-1 sm:pl-2">
            <div
              ref={progressTrackRef}
              onPointerDown={handleProgressPointerDown}
              className={`relative h-1.5 w-full rounded-full bg-white/8 ${
                isScrollable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                ref={progressThumbRef}
                className="absolute top-0 h-full rounded-full bg-primary/90"
                style={{
                  width: `${PROGRESS_THUMB_WIDTH}px`,
                  transform: 'translateX(0px)',
                  willChange: 'transform',
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrev}
              className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
              aria-label="Scroll left"
              disabled={!isScrollable}
            >
              <ChevronLeft size={18} />
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleNext}
              className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
              aria-label="Scroll right"
              disabled={!isScrollable}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// 'use client'

// import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { motion, useReducedMotion } from 'motion/react'
// import { ChevronLeft, ChevronRight } from 'lucide-react'
// import {
//   getCreateYourLookSearchParams,
//   getHasMoreSearchResults,
//   getReadyTemplateCategories,
//   getYourLookSearchLoading,
//   getYourLookSearchTemplates,
// } from '@/store/ready-template/ready-template-selectors'
// import { getYourLookSearchTemplates as getYourLookSearchTemplatesOperation } from '@/store/ready-template/ready-template-operations'
// import {
//   setCreateYourLookSearchParams,
//   setSelectedYourLookTemplate,
// } from '@/store/ready-template/ready-template-slice'

// import Text from '@/components/shared/text/Text'
// import Button from '@/components/shared/button/Button'
// import { useTranslate } from '@/utils/translate/translate'

// const AUTO_SCROLL_SPEED = 0.42
// const LOAD_MORE_OFFSET = 520
// const RESUME_DELAY_MS = 1400
// const PROGRESS_THUMB_WIDTH = 28

// function mapTemplateItem(item) {
//   return {
//     id: item?._id || item?.slug || String(item?.previewUrl || Math.random()),
//     title: String(item?.title || '').trim(),
//     category: String(item?.category || '').trim(),
//     previewUrl: String(item?.previewUrl || '').trim(),
//     slug: String(item?.slug || '').trim(),
//   }
// }

// function getScrollStep(container) {
//   if (!container) return 320
//   return Math.max(container.clientWidth * 0.72, 260)
// }

// function clamp(value, min, max) {
//   return Math.max(min, Math.min(max, value))
// }

// function getOriginalTrackWidth(trackNode, templatesCount) {
//   if (!trackNode || !templatesCount) return 0

//   const children = Array.from(trackNode.children).slice(0, templatesCount)
//   if (!children.length) return 0

//   const firstChild = children[0]
//   const lastChild = children[children.length - 1]

//   return lastChild.offsetLeft + lastChild.offsetWidth - firstChild.offsetLeft
// }

// function getLoopWidth(trackNode, templatesCount) {
//   if (!trackNode || !templatesCount) return 0

//   const children = Array.from(trackNode.children)
//   const secondCopyFirstChild = children[templatesCount]

//   if (secondCopyFirstChild) {
//     return secondCopyFirstChild.offsetLeft
//   }

//   return getOriginalTrackWidth(trackNode, templatesCount)
// }

// function RailTemplateCard({ item, onPause, onResume, onSelect }) {
//   const reducedMotion = useReducedMotion()

//   if (!item?.previewUrl) return null

//   return (
//     <motion.article
//       role="button"
//       tabIndex={0}
//       onClick={() => onSelect?.(item)}
//       onKeyDown={(e) => {
//         if (e.key === 'Enter' || e.key === ' ') {
//           e.preventDefault()
//           onSelect?.(item)
//         }
//       }}
//       initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
//       animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
//       transition={{
//         duration: reducedMotion ? 0 : 0.55,
//         ease: [0.22, 1, 0.36, 1],
//       }}
//       onMouseEnter={onPause}
//       onMouseLeave={onResume}
//       onFocus={onPause}
//       onBlur={onResume}
//       className="group relative w-[calc(100vw-64px)] max-w-[360px] shrink-0 cursor-pointer overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:border-primary/30 sm:w-[300px] md:w-[320px] lg:w-[270px] xl:w-[280px]"
//     >
//       <div className="pointer-events-none absolute inset-0">
//         <div className="absolute left-[-10%] top-[-12%] h-28 w-28 rounded-full bg-primary/12 blur-3xl" />
//         <div className="absolute bottom-[-12%] right-[-12%] h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
//       </div>

//       <div className="relative aspect-[4/5] overflow-hidden">
//         <motion.img
//           src={item.previewUrl}
//           alt={item.title}
//           className="absolute inset-[-1px] h-[calc(100%+2px)] w-[calc(100%+2px)] object-cover object-[50%_5%]"
//           whileHover={reducedMotion ? undefined : { scale: 1.045 }}
//           transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
//         />

//         <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(3,6,18,0.9)_0%,rgba(3,6,18,0.24)_38%,rgba(3,6,18,0.05)_66%,rgba(3,6,18,0.02)_100%)]" />

//         <div className="absolute inset-x-0 bottom-0 z-[2] p-4">
//           {item.category ? (
//             <span className="mb-2 inline-flex rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary-soft backdrop-blur-sm">
//               {item.category}
//             </span>
//           ) : null}

//           <Text
//             as="h3"
//             variant="body"
//             color="white"
//             caseMode="sentence"
//             className="line-clamp-2 pr-2"
//           >
//             {item.title}
//           </Text>
//         </div>
//       </div>
//     </motion.article>
//   )
// }

// export default function CreateYourLookDefaultTemplatesRail() {
//   const dispatch = useDispatch()
//   const reducedMotion = useReducedMotion()
//   const templatesRaw = useSelector(getYourLookSearchTemplates)
//   const searchParams = useSelector(getCreateYourLookSearchParams)
//   const loading = useSelector(getYourLookSearchLoading)
//   const hasMore = useSelector(getHasMoreSearchResults)
//   const categories = useSelector(getReadyTemplateCategories) || []

//   const isSearchMode =
//     searchParams.query ||
//     (searchParams.selectedCategory && searchParams.selectedCategory !== 'All')

//   const templates = useMemo(
//     () =>
//       (templatesRaw || [])
//         .map(mapTemplateItem)
//         .filter((item) => item.previewUrl),
//     [templatesRaw],
//   )

//   const totalTemplates = useMemo(() => {
//     return categories.reduce(
//       (sum, item) => sum + Number(item?.templatesCount || 0),
//       0,
//     )
//   }, [categories])

//   const railText = useTranslate(
//     isSearchMode
//       ? `Found ${templatesRaw.length} templates matching your search`
//       : `Explore ${totalTemplates || templates.length} curated templates and find the look that reflects your individuality best.`,
//     { caseMode: 'sentence' },
//   )

//   const containerRef = useRef(null)
//   const trackRef = useRef(null)
//   const progressTrackRef = useRef(null)
//   const progressThumbRef = useRef(null)
//   const firstTrackWidthRef = useRef(0)
//   const frameRef = useRef(null)
//   const resumeTimerRef = useRef(null)
//   const progressSmoothTimerRef = useRef(null)
//   const previousTemplatesCountRef = useRef(0)
//   const isAppendingRef = useRef(false)
//   const isDraggingProgressRef = useRef(false)

//   const [isHovered, setIsHovered] = useState(false)
//   const [isPointerDown, setIsPointerDown] = useState(false)
//   const [isScrollable, setIsScrollable] = useState(false)

//   const shouldLoop = isScrollable && !hasMore && templates.length > 1

//   const renderedTemplates = useMemo(() => {
//     if (!shouldLoop) return templates
//     return [...templates, ...templates]
//   }, [templates, shouldLoop])

//   const applyThumbOffset = useCallback((progressValue, smooth = false) => {
//     const trackWidth = progressTrackRef.current?.clientWidth || 0
//     const thumbNode = progressThumbRef.current
//     if (!thumbNode || trackWidth <= 0) return

//     const travel = Math.max(trackWidth - PROGRESS_THUMB_WIDTH, 0)
//     const offset = progressValue * travel

//     thumbNode.style.transition = smooth
//       ? 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
//       : 'none'

//     thumbNode.style.transform = `translateX(${offset}px)`
//   }, [])

//   const getCurrentProgress = useCallback(() => {
//     const node = containerRef.current
//     if (!node) return 0

//     let maxScrollable = node.scrollWidth - node.clientWidth
//     let currentScrollLeft = node.scrollLeft

//     if (shouldLoop && firstTrackWidthRef.current > 0) {
//       currentScrollLeft = currentScrollLeft % firstTrackWidthRef.current
//       maxScrollable = firstTrackWidthRef.current - node.clientWidth
//     }

//     if (maxScrollable <= 0) return 0

//     return clamp(currentScrollLeft / maxScrollable, 0, 1)
//   }, [shouldLoop])

//   const pauseAutoScroll = useCallback(() => {
//     setIsHovered(true)
//     if (resumeTimerRef.current) {
//       clearTimeout(resumeTimerRef.current)
//       resumeTimerRef.current = null
//     }
//   }, [])

//   const resumeAutoScrollImmediately = useCallback(() => {
//     if (resumeTimerRef.current) {
//       clearTimeout(resumeTimerRef.current)
//       resumeTimerRef.current = null
//     }
//     setIsHovered(false)
//   }, [])

//   const resumeAutoScrollWithDelay = useCallback(() => {
//     if (resumeTimerRef.current) {
//       clearTimeout(resumeTimerRef.current)
//     }

//     resumeTimerRef.current = setTimeout(() => {
//       setIsHovered(false)
//     }, RESUME_DELAY_MS)
//   }, [])

//   const updateProgress = useCallback(() => {
//     applyThumbOffset(getCurrentProgress())
//   }, [applyThumbOffset, getCurrentProgress])

//   const setScrollFromProgress = useCallback(
//     (nextProgress, behavior = 'auto') => {
//       const node = containerRef.current
//       if (!node) return

//       const safeProgress = clamp(nextProgress, 0, 1)

//       let maxScrollable = node.scrollWidth - node.clientWidth
//       if (shouldLoop && firstTrackWidthRef.current > 0) {
//         maxScrollable = firstTrackWidthRef.current - node.clientWidth
//       }

//       const targetLeft = safeProgress * maxScrollable

//       if (behavior === 'smooth') {
//         node.scrollTo({ left: targetLeft, behavior: 'smooth' })
//       } else {
//         node.scrollLeft = targetLeft
//       }

//       applyThumbOffset(safeProgress)
//     },
//     [applyThumbOffset, shouldLoop],
//   )

//   const maybeLoadMore = useCallback(() => {
//     const node = containerRef.current
//     if (!node || loading || !hasMore || isAppendingRef.current) return

//     const distanceToEnd =
//       node.scrollWidth - (node.scrollLeft + node.clientWidth)

//     if (distanceToEnd <= LOAD_MORE_OFFSET) {
//       const nextPage = Number(searchParams?.page || 1) + 1

//       isAppendingRef.current = true

//       const nextParams = {
//         ...searchParams,
//         page: nextPage,
//       }

//       dispatch(setCreateYourLookSearchParams({ page: nextPage }))

//       dispatch(
//         getYourLookSearchTemplatesOperation({
//           ...nextParams,
//           mode: 'append',
//         }),
//       )
//     }
//   }, [dispatch, hasMore, loading, searchParams])

//   useEffect(() => {
//     if (!loading) {
//       isAppendingRef.current = false
//     }
//   }, [loading])

//   useEffect(() => {
//     const previousCount = previousTemplatesCountRef.current
//     const currentCount = templates.length

//     if (previousCount > 0 && currentCount > previousCount) {
//       requestAnimationFrame(() => {
//         applyThumbOffset(getCurrentProgress(), true)

//         if (progressSmoothTimerRef.current) {
//           clearTimeout(progressSmoothTimerRef.current)
//         }

//         progressSmoothTimerRef.current = setTimeout(() => {
//           const thumbNode = progressThumbRef.current
//           if (thumbNode) {
//             thumbNode.style.transition = 'none'
//           }
//         }, 460)
//       })
//     }

//     previousTemplatesCountRef.current = currentCount
//   }, [applyThumbOffset, getCurrentProgress, templates.length])

//   useEffect(() => {
//     const node = containerRef.current
//     const trackNode = trackRef.current

//     if (!node || !trackNode) return

//     const measure = () => {
//       const containerWidth = node.clientWidth
//       const originalTrackWidth = getOriginalTrackWidth(
//         trackNode,
//         templates.length,
//       )

//       const scrollable = originalTrackWidth > containerWidth + 2
//       setIsScrollable(scrollable)

//       if (!scrollable) {
//         firstTrackWidthRef.current = 0
//         applyThumbOffset(0)
//         node.scrollLeft = 0
//         return
//       }

//       if (shouldLoop) {
//         firstTrackWidthRef.current = getLoopWidth(trackNode, templates.length)
//       } else {
//         firstTrackWidthRef.current = 0
//       }

//       updateProgress()
//     }

//     measure()

//     const resizeObserver =
//       typeof ResizeObserver !== 'undefined'
//         ? new ResizeObserver(() => measure())
//         : null

//     if (resizeObserver) {
//       resizeObserver.observe(node)
//       resizeObserver.observe(trackNode)
//       if (progressTrackRef.current) {
//         resizeObserver.observe(progressTrackRef.current)
//       }
//     }

//     return () => {
//       if (resizeObserver) resizeObserver.disconnect()
//     }
//   }, [
//     applyThumbOffset,
//     renderedTemplates,
//     shouldLoop,
//     templates.length,
//     updateProgress,
//   ])

//   useEffect(() => {
//     const node = containerRef.current
//     const trackNode = trackRef.current

//     if (!node || !trackNode || !shouldLoop) {
//       firstTrackWidthRef.current = 0
//       return
//     }

//     const loopWidth = getLoopWidth(trackNode, templates.length)
//     firstTrackWidthRef.current = loopWidth

//     if (loopWidth > 0) {
//       node.scrollLeft = node.scrollLeft % loopWidth || 1
//     }
//   }, [renderedTemplates, shouldLoop, templates.length])

//   const handlePrev = useCallback(() => {
//     const node = containerRef.current
//     if (!node || !isScrollable) return

//     pauseAutoScroll()
//     node.scrollBy({
//       left: -getScrollStep(node),
//       behavior: 'smooth',
//     })
//     resumeAutoScrollWithDelay()
//   }, [isScrollable, pauseAutoScroll, resumeAutoScrollWithDelay])

//   const handleNext = useCallback(() => {
//     const node = containerRef.current
//     if (!node || !isScrollable) return

//     pauseAutoScroll()
//     node.scrollBy({
//       left: getScrollStep(node),
//       behavior: 'smooth',
//     })
//     maybeLoadMore()
//     resumeAutoScrollWithDelay()
//   }, [isScrollable, maybeLoadMore, pauseAutoScroll, resumeAutoScrollWithDelay])

//   useEffect(() => {
//     if (reducedMotion || !isScrollable) return

//     const node = containerRef.current
//     if (!node) return

//     let rafId = null

//     const tick = () => {
//       if (!node) return

//       if (!isHovered && !isPointerDown && !isDraggingProgressRef.current) {
//         node.scrollLeft += AUTO_SCROLL_SPEED

//         if (shouldLoop && firstTrackWidthRef.current > 0) {
//           if (node.scrollLeft >= firstTrackWidthRef.current) {
//             node.scrollLeft -= firstTrackWidthRef.current
//           }
//         }

//         maybeLoadMore()
//         updateProgress()
//       }

//       rafId = requestAnimationFrame(tick)
//     }

//     rafId = requestAnimationFrame(tick)
//     frameRef.current = rafId

//     return () => {
//       if (rafId) cancelAnimationFrame(rafId)
//     }
//   }, [
//     isHovered,
//     isPointerDown,
//     isScrollable,
//     maybeLoadMore,
//     reducedMotion,
//     shouldLoop,
//     updateProgress,
//   ])

//   useEffect(() => {
//     updateProgress()
//   }, [templates, isScrollable, updateProgress])

//   useEffect(() => {
//     return () => {
//       if (frameRef.current) cancelAnimationFrame(frameRef.current)
//       if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
//       if (progressSmoothTimerRef.current) {
//         clearTimeout(progressSmoothTimerRef.current)
//       }
//     }
//   }, [])

//   const handleScroll = useCallback(() => {
//     const node = containerRef.current
//     if (!node) return

//     if (shouldLoop && firstTrackWidthRef.current > 0) {
//       if (node.scrollLeft >= firstTrackWidthRef.current) {
//         node.scrollLeft -= firstTrackWidthRef.current
//       } else if (node.scrollLeft <= 0) {
//         node.scrollLeft += firstTrackWidthRef.current
//       }
//     }

//     maybeLoadMore()
//     updateProgress()
//   }, [maybeLoadMore, shouldLoop, updateProgress])

//   const handleProgressPointerMove = useCallback(
//     (clientX, isDrag = true) => {
//       const trackNode = progressTrackRef.current
//       if (!trackNode || !isScrollable) return

//       const rect = trackNode.getBoundingClientRect()
//       const trackWidth = rect.width
//       if (trackWidth <= 0) return

//       const rawX = clientX - rect.left
//       const safeX = clamp(rawX, 0, trackWidth)
//       const nextProgress = safeX / trackWidth

//       setScrollFromProgress(nextProgress, isDrag ? 'auto' : 'smooth')
//     },
//     [isScrollable, setScrollFromProgress],
//   )

//   const handleProgressPointerDown = useCallback(
//     (e) => {
//       if (!isScrollable) return

//       e.preventDefault()
//       isDraggingProgressRef.current = true
//       pauseAutoScroll()
//       handleProgressPointerMove(e.clientX, true)

//       const onMove = (event) => {
//         handleProgressPointerMove(event.clientX, true)
//       }

//       const onUp = () => {
//         isDraggingProgressRef.current = false
//         window.removeEventListener('pointermove', onMove)
//         window.removeEventListener('pointerup', onUp)
//         resumeAutoScrollWithDelay()
//       }

//       window.addEventListener('pointermove', onMove)
//       window.addEventListener('pointerup', onUp)
//     },
//     [
//       handleProgressPointerMove,
//       isScrollable,
//       pauseAutoScroll,
//       resumeAutoScrollWithDelay,
//     ],
//   )

//   const handleSelectTemplate = useCallback(
//     (item) => {
//       if (!item?.id) return
//       pauseAutoScroll()
//       dispatch(setSelectedYourLookTemplate(item))
//     },
//     [dispatch, pauseAutoScroll],
//   )

//   if (!templates.length && !loading) return null

//   return (
//     <section className="gradient-border-card overflow-hidden p-5 sm:p-6 lg:p-7">
//       <div className="mb-6 flex items-start justify-between gap-4">
//         <div className="max-w-2xl">
//           <Text as="h2" variant="h2" color="white" caseMode="sentence">
//             Explore looks
//           </Text>

//           <Text
//             as="p"
//             variant="body"
//             color="muted"
//             caseMode="sentence"
//             className="mt-3 max-w-[720px]"
//           >
//             {railText}
//           </Text>
//         </div>

//         <div className="hidden items-center gap-2 md:flex">
//           <Button
//             type="button"
//             variant="secondary"
//             onClick={handlePrev}
//             className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
//             aria-label="Scroll left"
//             disabled={!isScrollable}
//           >
//             <ChevronLeft size={18} />
//           </Button>

//           <Button
//             type="button"
//             variant="secondary"
//             onClick={handleNext}
//             className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
//             aria-label="Scroll right"
//             disabled={!isScrollable}
//           >
//             <ChevronRight size={18} />
//           </Button>
//         </div>
//       </div>

//       <div className="relative">
//         <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background/65 via-background/30 to-transparent" />
//         <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background/65 via-background/30 to-transparent" />

//         <div
//           ref={containerRef}
//           onScroll={handleScroll}
//           onMouseEnter={pauseAutoScroll}
//           onMouseLeave={resumeAutoScrollImmediately}
//           onPointerDown={() => {
//             setIsPointerDown(true)
//             pauseAutoScroll()
//           }}
//           onPointerUp={() => {
//             setIsPointerDown(false)
//             resumeAutoScrollWithDelay()
//           }}
//           onPointerCancel={() => {
//             setIsPointerDown(false)
//             resumeAutoScrollWithDelay()
//           }}
//           className="hide-scrollbar overflow-x-auto overflow-y-hidden"
//           style={{
//             scrollbarWidth: 'none',
//             msOverflowStyle: 'none',
//           }}
//         >
//           <div
//             ref={trackRef}
//             className="flex w-max gap-4 pr-4 sm:gap-5 sm:pr-5"
//           >
//             {renderedTemplates.map((item, index) => (
//               <RailTemplateCard
//                 key={`${item.id}-${index}`}
//                 item={item}
//                 onPause={pauseAutoScroll}
//                 onResume={resumeAutoScrollImmediately}
//                 onSelect={handleSelectTemplate}
//               />
//             ))}

//             {loading ? (
//               <>
//                 <div className="h-[300px] w-[calc(100vw-64px)] max-w-[360px] shrink-0 animate-pulse rounded-[26px] border border-white/8 bg-white/[0.03] sm:w-[300px] md:w-[320px] lg:w-[270px] xl:w-[280px]" />

//                 <div className="hidden h-[300px] w-[calc(100vw-64px)] max-w-[360px] shrink-0 animate-pulse rounded-[26px] border border-white/8 bg-white/[0.03] sm:block sm:w-[300px] md:w-[320px] lg:w-[270px] xl:w-[280px]" />
//               </>
//             ) : null}
//           </div>
//         </div>

//         <div className="mt-6 flex items-center justify-between gap-4">
//           <div className="min-w-0 flex-1 pl-1 sm:pl-2">
//             <div
//               ref={progressTrackRef}
//               onPointerDown={handleProgressPointerDown}
//               className={`relative h-1.5 w-full rounded-full bg-white/8 ${
//                 isScrollable ? 'cursor-pointer' : 'cursor-default'
//               }`}
//             >
//               <div
//                 ref={progressThumbRef}
//                 className="absolute top-0 h-full rounded-full bg-primary/90"
//                 style={{
//                   width: `${PROGRESS_THUMB_WIDTH}px`,
//                   transform: 'translateX(0px)',
//                   willChange: 'transform',
//                 }}
//               />
//             </div>
//           </div>

//           <div className="flex items-center justify-center gap-2 md:hidden">
//             <Button
//               type="button"
//               variant="secondary"
//               onClick={handlePrev}
//               className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
//               aria-label="Scroll left"
//               disabled={!isScrollable}
//             >
//               <ChevronLeft size={18} />
//             </Button>

//             <Button
//               type="button"
//               variant="secondary"
//               onClick={handleNext}
//               className="rounded-full border-white/10 bg-white/[0.04] px-4 hover:bg-white/[0.08]"
//               aria-label="Scroll right"
//               disabled={!isScrollable}
//             >
//               <ChevronRight size={18} />
//             </Button>
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }
