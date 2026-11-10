'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { Maximize2, Trash2, Volume2, VolumeX, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Text from '@/components/shared/text/Text'
import PreviewBadge from '@/components/shared/preview-badge/PreviewBadge'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import ConfirmModal from '@/components/shared/confirm-modal/ConfirmModal'
import Photo from '@/components/shared/photo/Photo'
import {
  PhotoStackNavButtons,
  usePhotoStackCarousel,
} from '@/components/shared/photo-stack-carousel/PhotoStackCarouselControls'
import { ANIMATE_MODES } from '@/constants/animate'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'
import { getUser } from '@/store/auth/auth-selectors'
import {
  axiosDeleteAnimateTemplate,
  axiosGetAnimateTemplates,
} from '@/services/api/animate'

const FALLBACK = {
  id: 'instagram_photo',
  chipLabel: 'Alive photo',
  title: 'Make your photo come alive',
  description:
    'Same person, soft motion, short clip ready for Reels-style sharing.',
}

const VOLUME_STORAGE_KEY = 'animateShowcaseVolume'
const DEFAULT_VOLUME = 0.35
const ROTATE_PAUSE_MS = 2000
const MOTION_EASE = [0.22, 1, 0.36, 1]

const clamp01 = (n) => Math.min(1, Math.max(0, n))

function getModeMeta(modeId) {
  return ANIMATE_MODES.find((mode) => mode.id === modeId) || ANIMATE_MODES[0]
}

function ModeChip({ mode, active, pinned, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1.5 text-xs transition',
        active
          ? 'border-primary/50 bg-primary/15 text-white'
          : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-cyan-400/30 hover:text-white',
        pinned && 'ring-1 ring-primary/30',
      )}
    >
      {mode.chipLabel || mode.title}
    </button>
  )
}

/**
 * Reference photos as a deck of cards — same size as our reference preview
 * (240/260 × 16:10), stacked one behind another.
 */
function ReferencePhotoDeck({
  urls = [],
  resetKey = '',
  title = 'Reference photo',
  onOpenPreview,
}) {
  const list = useMemo(
    () =>
      (Array.isArray(urls) ? urls : [])
        .map((url) => String(url || '').trim())
        .filter(Boolean),
    [urls],
  )

  const mainSrc = list[0] || ''
  const extraSrcs = list.slice(1)
  const carousel = usePhotoStackCarousel({
    mainSrc,
    extraSrcs,
    resetKey,
  })

  const deckSrcs = useMemo(() => {
    if (!list.length) return []
    if (!carousel.hasExtras) return [mainSrc]
    const current = carousel.displaySrc || mainSrc
    const behind = list.filter((src) => src !== current)
    return [current, ...behind]
  }, [carousel.displaySrc, carousel.hasExtras, list, mainSrc])

  if (!mainSrc) return null

  return (
    <div className="relative w-full max-w-[240px] pt-3 pl-3 sm:max-w-[260px]">
      {/* Fixed aspect box so fill images don't collapse to height 0 */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
        {deckSrcs.map((src, index) => {
          const offset = index * 10
          return (
            <div
              key={`${src}-${index}`}
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px] border border-white/20 bg-background-soft shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
              style={{
                zIndex: deckSrcs.length - index,
                transform: `translate(${-offset}px, ${-offset}px)`,
              }}
            >
              <div className="relative h-full w-full">
                <Photo
                  src={src}
                  alt={title}
                  fill
                  sizes="260px"
                  className="!object-cover object-center"
                />
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => onOpenPreview?.(carousel.displaySrc || mainSrc)}
          aria-label="Open reference photo preview"
          className="absolute inset-0 z-[3] cursor-zoom-in rounded-[18px]"
        />

        <div className="pointer-events-none absolute left-2.5 top-2.5 z-[5]">
          <PreviewBadge tone="primary">
            {carousel.hasExtras
              ? `Reference ${carousel.safeStep + 1}/${carousel.maxStep + 1}`
              : 'Reference'}
          </PreviewBadge>
        </div>

        {carousel.hasExtras ? (
          <PhotoStackNavButtons
            canGoLeft={carousel.canGoLeft}
            canGoRight={carousel.canGoRight}
            onLeft={carousel.goLeft}
            onRight={carousel.goRight}
          />
        ) : null}
      </div>
    </div>
  )
}

function flattenTemplatesByMode(grouped = {}) {
  return ANIMATE_MODES.flatMap((mode) => {
    const list = grouped?.[mode.id]
    return (Array.isArray(list) ? list : []).filter(
      (item) => item?.resultVideoUrl,
    )
  })
}

export default function AnimateShowcasePreview() {
  const user = useSelector(getUser)
  const isAdmin = user?.role === 'admin'
  const reducedMotion = useReducedMotion()
  const videoRef = useRef(null)
  const videoFrameRef = useRef(null)
  const fullscreenVideoRef = useRef(null)
  const rotateTimeoutRef = useRef(null)
  const fullscreenResumeRef = useRef({
    shouldAdvance: false,
    resumeTime: 0,
  })
  const skipNextFramePlayRef = useRef(false)
  const wasVideoFullscreenRef = useRef(false)
  const [templatesByMode, setTemplatesByMode] = useState({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [pinnedModeId, setPinnedModeId] = useState(null)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState(null)
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false)

  const syncAudioToFrameVideos = useCallback((muted, nextVolume = volume) => {
    const nodes = videoFrameRef.current?.querySelectorAll('video')
    if (!nodes?.length) return
    nodes.forEach((node) => {
      node.muted = Boolean(muted)
      try {
        node.volume = clamp01(nextVolume)
      } catch {
        // ignore
      }
      if (muted) {
        node.muted = true
      }
    })
  }, [volume])
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  useEffect(() => {
    let cancelled = false
    axiosGetAnimateTemplates()
      .then((data) => {
        if (cancelled) return
        setTemplatesByMode(data?.templates || {})
        setActiveIndex(0)
      })
      .catch(() => {
        if (!cancelled) {
          setTemplatesByMode({})
          setActiveIndex(0)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOLUME_STORAGE_KEY)
      if (saved != null) setVolume(clamp01(Number(saved)))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rotateTimeoutRef.current) {
        clearTimeout(rotateTimeoutRef.current)
      }
    }
  }, [])

  const templates = useMemo(() => {
    if (pinnedModeId) {
      const list = templatesByMode?.[pinnedModeId]
      return (Array.isArray(list) ? list : []).filter(
        (item) => item?.resultVideoUrl,
      )
    }
    return flattenTemplatesByMode(templatesByMode)
  }, [pinnedModeId, templatesByMode])

  const featured = useMemo(() => {
    if (!templates.length) return null
    return templates[activeIndex % templates.length] || templates[0]
  }, [activeIndex, templates])

  const highlightedModeId =
    pinnedModeId || featured?.mode || ANIMATE_MODES[0].id
  const modeMeta = getModeMeta(highlightedModeId)
  const contentKey = `${featured?._id || featured?.resultVideoUrl || 'empty'}-${activeIndex}`
  const hasVideo = Boolean(featured?.resultVideoUrl)
  const hasMultiple = templates.length > 1
  const referenceUrls = useMemo(() => {
    const fromArray = Array.isArray(featured?.referenceImageUrls)
      ? featured.referenceImageUrls
          .map((url) => String(url || '').trim())
          .filter(Boolean)
      : []
    if (fromArray.length) return fromArray
    const single = String(featured?.sourceImageUrl || '').trim()
    return single ? [single] : []
  }, [featured?.referenceImageUrls, featured?.sourceImageUrl])
  const mainReferenceUrl = referenceUrls[0] || ''

  useEffect(() => {
    if (!templates.length) {
      setActiveIndex(0)
      return
    }
    if (activeIndex >= templates.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, templates.length])

  const goToNextTemplate = useCallback(() => {
    if (!hasMultiple) return
    syncAudioToFrameVideos(true, volume)
    videoFrameRef.current?.querySelectorAll('video').forEach((node) => {
      try {
        node.pause()
      } catch {
        // ignore
      }
    })
    setActiveIndex((current) => (current + 1) % templates.length)
  }, [hasMultiple, syncAudioToFrameVideos, templates.length, volume])

  const playFrameVideo = useCallback((resumeTime) => {
    const el = videoRef.current
    if (!el) return

    try {
      if (Number.isFinite(resumeTime) && resumeTime > 0) {
        const duration = Number(el.duration)
        if (Number.isFinite(duration) && duration > 0) {
          el.currentTime = Math.min(resumeTime, Math.max(duration - 0.05, 0))
        } else {
          el.currentTime = resumeTime
        }
      } else if (el.ended) {
        el.currentTime = 0
      }
    } catch {
      // ignore seek errors
    }

    el.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (!hasVideo) return

    syncAudioToFrameVideos(isMuted, volume)

    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamp01(volume)))
    } catch {
      // ignore
    }

    if (isVideoFullscreen) {
      videoFrameRef.current?.querySelectorAll('video').forEach((node) => {
        try {
          node.pause()
        } catch {
          // ignore
        }
      })
      return
    }

    if (skipNextFramePlayRef.current) {
      skipNextFramePlayRef.current = false
      return
    }

    playFrameVideo()
  }, [
    activeIndex,
    featured?.resultVideoUrl,
    hasVideo,
    isMuted,
    isVideoFullscreen,
    playFrameVideo,
    syncAudioToFrameVideos,
    volume,
  ])

  useEffect(() => {
    if (!isVideoFullscreen) return

    const node = fullscreenVideoRef.current
    if (!node) return

    const resumeTime = Number(fullscreenResumeRef.current.resumeTime)
    if (Number.isFinite(resumeTime) && resumeTime > 0) {
      try {
        node.currentTime = resumeTime
      } catch {
        // ignore
      }
    }

    node.muted = Boolean(isMuted)
    try {
      node.volume = clamp01(volume)
    } catch {
      // ignore
    }
    if (isMuted) node.muted = true
    node.play().catch(() => {})
  }, [isMuted, isVideoFullscreen, volume, featured?.resultVideoUrl])

  const handleVideoEnded = () => {
    if (isVideoFullscreen) return
    if (!hasMultiple) return
    if (rotateTimeoutRef.current) {
      clearTimeout(rotateTimeoutRef.current)
    }
    rotateTimeoutRef.current = setTimeout(() => {
      goToNextTemplate()
    }, ROTATE_PAUSE_MS)
  }

  const handleModeChipClick = useCallback((modeId) => {
    if (rotateTimeoutRef.current) {
      clearTimeout(rotateTimeoutRef.current)
    }
    setPinnedModeId((current) => (current === modeId ? null : modeId))
    setActiveIndex(0)
  }, [])

  const openReferencePreview = useCallback((src) => {
    const nextSrc = String(src || '').trim()
    if (!nextSrc) return
    setPreviewModal({
      open: true,
      src: nextSrc,
      alt: featured?.title || 'Reference photo',
      title: 'Reference',
    })
  }, [featured?.title])

  const closeReferencePreview = useCallback(() => {
    setPreviewModal({ open: false, src: '', alt: '', title: '' })
  }, [])

  const openVideoFullscreen = useCallback(() => {
    if (!featured?.resultVideoUrl) return
    const el = videoRef.current
    const hadPendingRotate = Boolean(rotateTimeoutRef.current)
    if (rotateTimeoutRef.current) {
      clearTimeout(rotateTimeoutRef.current)
      rotateTimeoutRef.current = null
    }

    fullscreenResumeRef.current = {
      shouldAdvance: Boolean(
        hasMultiple && (hadPendingRotate || el?.ended),
      ),
      resumeTime: el && !el.ended ? Number(el.currentTime) || 0 : 0,
    }

    videoFrameRef.current?.querySelectorAll('video').forEach((node) => {
      try {
        node.pause()
      } catch {
        // ignore
      }
    })
    setIsVideoFullscreen(true)
  }, [featured?.resultVideoUrl, hasMultiple])

  const closeVideoFullscreen = useCallback(() => {
    const fs = fullscreenVideoRef.current
    const resume = fullscreenResumeRef.current
    if (!resume.shouldAdvance && fs && !fs.ended) {
      fullscreenResumeRef.current = {
        shouldAdvance: false,
        resumeTime: Number(fs.currentTime) || 0,
      }
    } else if (!resume.shouldAdvance && fs?.ended && hasMultiple) {
      fullscreenResumeRef.current = {
        shouldAdvance: true,
        resumeTime: 0,
      }
    }
    skipNextFramePlayRef.current = true
    setIsVideoFullscreen(false)
  }, [hasMultiple])

  useEffect(() => {
    if (!isVideoFullscreen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeVideoFullscreen()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeVideoFullscreen, isVideoFullscreen])

  useEffect(() => {
    const wasFullscreen = wasVideoFullscreenRef.current
    wasVideoFullscreenRef.current = isVideoFullscreen
    if (!wasFullscreen || isVideoFullscreen || !hasVideo) return

    const resume = fullscreenResumeRef.current
    if (resume.shouldAdvance && hasMultiple) {
      fullscreenResumeRef.current = { shouldAdvance: false, resumeTime: 0 }
      goToNextTemplate()
      return
    }

    const resumeTime = Number(resume.resumeTime)
    fullscreenResumeRef.current = { shouldAdvance: false, resumeTime: 0 }
    playFrameVideo(
      Number.isFinite(resumeTime) && resumeTime > 0 ? resumeTime : undefined,
    )
  }, [
    goToNextTemplate,
    hasMultiple,
    hasVideo,
    isVideoFullscreen,
    playFrameVideo,
  ])

  const handleConfirmDelete = useCallback(async () => {
    const templateId = String(templateToDelete?._id || '').trim()
    if (!templateId || isDeletingTemplate) return

    setIsDeletingTemplate(true)
    try {
      await axiosDeleteAnimateTemplate(templateId)
      setTemplatesByMode((prev) => {
        const next = {}
        Object.entries(prev || {}).forEach(([modeId, list]) => {
          next[modeId] = (Array.isArray(list) ? list : []).filter(
            (item) => String(item?._id) !== templateId,
          )
        })
        return next
      })
      setActiveIndex(0)
      setTemplateToDelete(null)
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeletingTemplate(false)
    }
  }, [isDeletingTemplate, templateToDelete])

  const applyAudioToFullscreenVideo = (muted, nextVolume = volume) => {
    const node = fullscreenVideoRef.current
    if (!node) return
    node.muted = Boolean(muted)
    try {
      node.volume = clamp01(nextVolume)
    } catch {
      // ignore
    }
    if (muted) node.muted = true
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    let nextVolume = volume
    if (!nextMuted && volume <= 0) {
      nextVolume = DEFAULT_VOLUME
      setVolume(nextVolume)
    }
    setIsMuted(nextMuted)
    syncAudioToFrameVideos(nextMuted, nextVolume)
    applyAudioToFullscreenVideo(nextMuted, nextVolume)
    if (!nextMuted) {
      if (isVideoFullscreen) {
        fullscreenVideoRef.current?.play().catch(() => {})
      } else {
        videoRef.current?.play().catch(() => {})
      }
    }
  }

  const onVolumeChange = (event) => {
    const next = clamp01(Number(event.target.value))
    setVolume(next)
    if (next > 0 && isMuted) {
      setIsMuted(false)
      syncAudioToFrameVideos(false, next)
      applyAudioToFullscreenVideo(false, next)
      if (isVideoFullscreen) {
        fullscreenVideoRef.current?.play().catch(() => {})
      } else {
        videoRef.current?.play().catch(() => {})
      }
      return
    }
    if (next <= 0) {
      setIsMuted(true)
      syncAudioToFrameVideos(true, next)
      applyAudioToFullscreenVideo(true, next)
      return
    }
    syncAudioToFrameVideos(isMuted, next)
    applyAudioToFullscreenVideo(isMuted, next)
  }

  return (
    <section className="gradient-border-card overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="flex h-full min-h-[357px] flex-col p-2 sm:min-h-[391px] sm:p-3">
          <div className="flex flex-1 flex-col justify-center">
            <Text
              as="p"
              variant="caption"
              color="soft"
              caseMode="sentence"
              className="mb-2 uppercase tracking-[0.22em]"
            >
              live preview
            </Text>

            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={`copy-${contentKey}`}
                initial={
                  reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
                }
                animate={
                  reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                exit={
                  reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                }
                transition={{
                  duration: reducedMotion ? 0.1 : 0.55,
                  ease: MOTION_EASE,
                }}
              >
                <Text as="h2" variant="h2" color="white" caseMode="sentence">
                  {featured?.title || modeMeta.title || FALLBACK.title}
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                  className="mt-3 max-w-xl leading-6 line-clamp-6"
                >
                  {featured?.prompt ||
                    modeMeta.description ||
                    FALLBACK.description}
                </Text>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 lg:mt-0 lg:pt-5">
            {ANIMATE_MODES.map((mode) => (
              <ModeChip
                key={mode.id}
                mode={mode}
                active={highlightedModeId === mode.id}
                pinned={pinnedModeId === mode.id}
                onClick={() => handleModeChipClick(mode.id)}
              />
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[357px] flex-col sm:min-h-[391px]">
          <motion.div
            initial={
              reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }
            }
            animate={
              reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{
              duration: reducedMotion ? 0 : 0.55,
              ease: MOTION_EASE,
            }}
            className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-5"
          >
            {isAdmin && featured?._id ? (
              <button
                type="button"
                onClick={() => setTemplateToDelete(featured)}
                className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 text-red-100 backdrop-blur-md transition hover:border-red-300/60 hover:bg-red-500/25 sm:right-5 sm:top-5"
                aria-label="Delete template"
              >
                <Trash2 size={16} />
              </button>
            ) : null}

            <div
              ref={videoFrameRef}
              className="group relative min-h-0 w-full flex-1 overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,0.28),transparent_55%),linear-gradient(180deg,rgba(20,23,32,0.92),rgba(10,12,18,0.96))]"
            >
              {hasVideo ? (
                <>
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={contentKey}
                      className="absolute inset-0"
                      initial={
                        reducedMotion
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              scale: 1.03,
                              filter: 'blur(2px)',
                            }
                      }
                      animate={
                        reducedMotion
                          ? { opacity: 1 }
                          : {
                              opacity: 1,
                              scale: 1,
                              filter: 'blur(0px)',
                            }
                      }
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: reducedMotion ? 0.1 : 0.95,
                        ease: MOTION_EASE,
                      }}
                    >
                      <video
                        ref={videoRef}
                        src={featured.resultVideoUrl}
                        poster={featured.sourceImageUrl || undefined}
                        muted={isMuted}
                        playsInline
                        autoPlay
                        loop={!hasMultiple}
                        onEnded={handleVideoEnded}
                        className="h-full w-full object-cover object-center"
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-4 sm:top-4 sm:gap-3">
                    <button
                      type="button"
                      onClick={openVideoFullscreen}
                      aria-label="Open video fullscreen"
                      title="Fullscreen"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-[1px] transition hover:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white/70"
                    >
                      <Maximize2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                      title={isMuted ? 'Unmute' : 'Mute'}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-[1px] transition hover:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white/70"
                    >
                      {isMuted || volume <= 0 ? (
                        <VolumeX size={16} />
                      ) : (
                        <Volume2 size={16} />
                      )}
                    </button>

                    <div className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-2 backdrop-blur-[1px] sm:flex">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={onVolumeChange}
                        aria-label="Volume"
                        className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-white/30 accent-white [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                      <span className="w-8 text-center text-xs tabular-nums text-white">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <Text
                    as="p"
                    variant="caption"
                    color="muted"
                    caseMode="sentence"
                    className="max-w-[260px] leading-6"
                  >
                    {pinnedModeId
                      ? 'No saved clips for this mode yet.'
                      : 'Save a horizontal clip from Animate Preview and it will fill this frame.'}
                  </Text>
                </div>
              )}

              {mainReferenceUrl ? (
                <div className="absolute bottom-3 left-3 z-10 w-[min(42%,240px)] sm:bottom-4 sm:left-4 sm:w-[min(38%,260px)]">
                  <ReferencePhotoDeck
                    urls={referenceUrls}
                    resetKey={`${featured?._id || featured?.resultVideoUrl || 'ref'}`}
                    title={featured?.title || 'Reference photo'}
                    onOpenPreview={openReferencePreview}
                  />
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closeReferencePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />

      {isVideoFullscreen && featured?.resultVideoUrl ? (
        <div
          className={`${MODAL_OVERLAY_CLASS} bg-black/90 px-0 sm:px-4`}
          onClick={closeVideoFullscreen}
          role="dialog"
          aria-modal="true"
          aria-label="Video fullscreen"
        >
          <div
            className="relative flex h-[100dvh] w-full max-w-[1400px] items-center justify-center sm:h-[min(95dvh,900px)] sm:rounded-[24px] sm:border sm:border-white/10 sm:bg-black/40 sm:shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <video
              ref={fullscreenVideoRef}
              src={featured.resultVideoUrl}
              poster={featured.sourceImageUrl || undefined}
              muted={isMuted}
              playsInline
              autoPlay
              loop
              className="h-full w-full object-contain"
            />

            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-4 sm:top-4 sm:gap-3">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-[1px] transition hover:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white/70"
              >
                {isMuted || volume <= 0 ? (
                  <VolumeX size={16} />
                ) : (
                  <Volume2 size={16} />
                )}
              </button>

              <div className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-2 backdrop-blur-[1px] sm:flex">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={onVolumeChange}
                  aria-label="Volume"
                  className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-white/30 accent-white [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
                <span className="w-8 text-center text-xs tabular-nums text-white">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={closeVideoFullscreen}
                aria-label="Close fullscreen"
                title="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-[1px] transition hover:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white/70"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(templateToDelete)}
        title="Delete template?"
        description="This action cannot be undone."
        detail={
          templateToDelete ? (
            <Text as="p" variant="body-sm" color="white" translate={false}>
              {templateToDelete.title || templateToDelete.prompt}
            </Text>
          ) : null
        }
        confirmLabel={isDeletingTemplate ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (isDeletingTemplate) return
          setTemplateToDelete(null)
        }}
        closeAriaLabel="Close delete confirmation"
      />
    </section>
  )
}
