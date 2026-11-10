'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Trash2, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Text from '@/components/shared/text/Text'
import PreviewBadge from '@/components/shared/preview-badge/PreviewBadge'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import ShowcasePreviewImage from '@/components/shared/showcase-preview-image/ShowcasePreviewImage'
import ConfirmModal from '@/components/shared/confirm-modal/ConfirmModal'
import { getUser } from '@/store/auth/auth-selectors'
import {
  axiosDeleteAnimateTemplate,
  axiosGetAnimateTemplates,
} from '@/services/api/animate'

const FALLBACK = {
  id: 'instagram_photo',
  chipLabel: 'Living photo',
  title: 'Animate your Instagram shot',
  description:
    'Same person, soft motion, short clip ready for Reels-style sharing.',
}

const MODE_COPY = {
  instagram_photo: {
    chipLabel: 'Living photo',
    title: 'Animate your Instagram shot',
    description:
      'Same person, soft motion, short clip ready for Reels-style sharing.',
  },
  prompt_refs: {
    chipLabel: 'Prompt + refs',
    title: 'Build a clip from references',
    description:
      'Describe the scene, keep identity from your photos, short social-ready video.',
  },
}

const VOLUME_STORAGE_KEY = 'animateShowcaseVolume'
const DEFAULT_VOLUME = 0.35
const ROTATE_PAUSE_MS = 2000
const MOTION_EASE = [0.22, 1, 0.36, 1]

const clamp01 = (n) => Math.min(1, Math.max(0, n))

export default function AnimateShowcasePreview() {
  const user = useSelector(getUser)
  const isAdmin = user?.role === 'admin'
  const reducedMotion = useReducedMotion()
  const videoRef = useRef(null)
  const videoFrameRef = useRef(null)
  const rotateTimeoutRef = useRef(null)
  const [templates, setTemplates] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
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
        // Keep playback, but ensure no audible leftovers during crossfade.
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
        const grouped = data?.templates || {}
        const flat = Object.values(grouped)
          .flatMap((list) => (Array.isArray(list) ? list : []))
          .filter((item) => item?.resultVideoUrl)
        setTemplates(flat)
        setActiveIndex(0)
      })
      .catch(() => {
        if (!cancelled) {
          setTemplates([])
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

  const featured = useMemo(() => {
    if (!templates.length) return null
    return templates[activeIndex % templates.length] || templates[0]
  }, [activeIndex, templates])

  const modeCopy =
    MODE_COPY[featured?.mode] || MODE_COPY.instagram_photo || FALLBACK
  const contentKey = `${featured?._id || featured?.resultVideoUrl || 'empty'}-${activeIndex}`
  const hasVideo = Boolean(featured?.resultVideoUrl)
  const hasMultiple = templates.length > 1
  const referenceUrl = String(featured?.sourceImageUrl || '').trim()

  useEffect(() => {
    if (!hasVideo) return

    syncAudioToFrameVideos(isMuted, volume)

    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamp01(volume)))
    } catch {
      // ignore
    }

    const el = videoRef.current
    if (el) {
      el.play().catch(() => {})
    }
  }, [
    activeIndex,
    featured?.resultVideoUrl,
    hasVideo,
    isMuted,
    syncAudioToFrameVideos,
    volume,
  ])

  const goToNextTemplate = () => {
    if (!hasMultiple) return
    // Silence any exiting clip before the next one mounts.
    syncAudioToFrameVideos(true, volume)
    videoFrameRef.current?.querySelectorAll('video').forEach((node) => {
      try {
        node.pause()
      } catch {
        // ignore
      }
    })
    setActiveIndex((current) => (current + 1) % templates.length)
  }

  const handleVideoEnded = () => {
    if (!hasMultiple) return
    if (rotateTimeoutRef.current) {
      clearTimeout(rotateTimeoutRef.current)
    }
    rotateTimeoutRef.current = setTimeout(() => {
      goToNextTemplate()
    }, ROTATE_PAUSE_MS)
  }

  const openReferencePreview = useCallback(() => {
    if (!referenceUrl) return
    setPreviewModal({
      open: true,
      src: referenceUrl,
      alt: featured?.title || 'Reference photo',
      title: 'Reference',
    })
  }, [featured?.title, referenceUrl])

  const closeReferencePreview = useCallback(() => {
    setPreviewModal({ open: false, src: '', alt: '', title: '' })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    const templateId = String(templateToDelete?._id || '').trim()
    if (!templateId || isDeletingTemplate) return

    setIsDeletingTemplate(true)
    try {
      await axiosDeleteAnimateTemplate(templateId)
      setTemplates((prev) => {
        const next = prev.filter((item) => String(item?._id) !== templateId)
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

  const toggleMute = () => {
    const nextMuted = !isMuted
    let nextVolume = volume
    if (!nextMuted && volume <= 0) {
      nextVolume = DEFAULT_VOLUME
      setVolume(nextVolume)
    }
    setIsMuted(nextMuted)
    syncAudioToFrameVideos(nextMuted, nextVolume)
    if (!nextMuted) {
      videoRef.current?.play().catch(() => {})
    }
  }

  const onVolumeChange = (event) => {
    const next = clamp01(Number(event.target.value))
    setVolume(next)
    if (next > 0 && isMuted) {
      setIsMuted(false)
      syncAudioToFrameVideos(false, next)
      videoRef.current?.play().catch(() => {})
      return
    }
    if (next <= 0) {
      setIsMuted(true)
      syncAudioToFrameVideos(true, next)
      return
    }
    syncAudioToFrameVideos(isMuted, next)
  }

  return (
    <section className="gradient-border-card overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="flex h-full min-h-0 flex-col gap-4 p-2 sm:p-3">
          <div className="shrink-0">
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
                  {featured?.title || modeCopy.title || FALLBACK.title}
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                  className="mt-3 max-w-xl leading-6 line-clamp-6"
                >
                  {featured?.prompt ||
                    modeCopy.description ||
                    FALLBACK.description}
                </Text>
              </motion.div>
            </AnimatePresence>
          </div>

          {referenceUrl ? (
            <motion.button
              type="button"
              onClick={openReferencePreview}
              aria-label="Open reference photo preview"
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
              className="group mt-auto w-full max-w-[240px] self-end cursor-zoom-in overflow-hidden rounded-[18px] border border-white/10 bg-background-soft/60 text-left shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition hover:border-white/25 sm:max-w-[260px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <AnimatePresence initial={false}>
                  <ShowcasePreviewImage
                    key={referenceUrl}
                    src={referenceUrl}
                    alt={featured?.title || 'Reference photo'}
                    imageKey={referenceUrl}
                    objectPositionClassName="object-center"
                    sizes="260px"
                    hoverScale={1.02}
                  />
                </AnimatePresence>
                <div className="pointer-events-none absolute left-2.5 top-2.5 z-[1]">
                  <PreviewBadge tone="primary">Reference</PreviewBadge>
                </div>
              </div>
            </motion.button>
          ) : null}
        </div>

        <div className="relative">
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
            className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-5"
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
              className="group relative aspect-[8/5] overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,0.28),transparent_55%),linear-gradient(180deg,rgba(20,23,32,0.92),rgba(10,12,18,0.96))]"
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

                  <div className="absolute left-3 top-3 z-10 flex items-center gap-2 sm:left-4 sm:top-4 sm:gap-3">
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
                    Save a horizontal clip from Animate Preview and it will
                    fill this frame.
                  </Text>
                </div>
              )}
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
