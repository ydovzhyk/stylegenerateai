'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import { axiosGetAnimateTemplates } from '@/services/api/animate'

const FALLBACK = {
  id: 'instagram_photo',
  chipLabel: 'Living photo',
  title: 'Animate your Instagram shot',
  description:
    'Same person, soft motion, short clip ready for Reels-style sharing.',
}

const VOLUME_STORAGE_KEY = 'animateShowcaseVolume'
const DEFAULT_VOLUME = 0.35

const clamp01 = (n) => Math.min(1, Math.max(0, n))

export default function AnimateShowcasePreview() {
  const videoRef = useRef(null)
  const [templates, setTemplates] = useState([])
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)

  useEffect(() => {
    let cancelled = false
    axiosGetAnimateTemplates()
      .then((data) => {
        if (cancelled) return
        const list = data?.templates?.instagram_photo || []
        setTemplates(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setTemplates([])
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

  const featured = useMemo(() => templates[0] || null, [templates])
  const hasVideo = Boolean(featured?.resultVideoUrl)

  useEffect(() => {
    const el = videoRef.current
    if (!el || !hasVideo) return

    el.muted = isMuted
    try {
      el.volume = clamp01(volume)
    } catch {
      // ignore
    }

    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamp01(volume)))
    } catch {
      // ignore
    }

    if (el.paused && isMuted) {
      el.play().catch(() => {})
    }
  }, [hasVideo, isMuted, volume])

  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    el.muted = nextMuted
    if (!nextMuted) {
      if (volume <= 0) {
        const restored = DEFAULT_VOLUME
        setVolume(restored)
        try {
          el.volume = restored
        } catch {
          // ignore
        }
      }
      el.play().catch(() => {})
    }
  }

  const onVolumeChange = (event) => {
    const next = clamp01(Number(event.target.value))
    setVolume(next)
    const el = videoRef.current
    if (!el) return
    try {
      el.volume = next
    } catch {
      // ignore
    }
    if (next > 0 && isMuted) {
      setIsMuted(false)
      el.muted = false
      el.play().catch(() => {})
    }
    if (next <= 0 && !isMuted) {
      setIsMuted(true)
      el.muted = true
    }
  }

  return (
    <section className="gradient-border-card overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="flex h-full flex-col justify-center p-2 sm:p-3">
          <Text
            as="p"
            variant="caption"
            color="soft"
            caseMode="sentence"
            className="mb-2 uppercase tracking-[0.22em]"
          >
            live preview
          </Text>
          <Text as="h2" variant="h2" color="white" caseMode="sentence">
            {featured?.title || FALLBACK.title}
          </Text>
          <Text
            as="p"
            variant="body-sm"
            color="muted"
            caseMode="sentence"
            className="mt-3 max-w-xl leading-6"
          >
            {featured?.prompt || FALLBACK.description}
          </Text>
        </div>

        {/*
          Same footprint as Imagine/Photo Lab dual-card media column.
          Horizontal clip fills the frame (object-cover, centered).
          8/5 ≈ height of two side-by-side aspect-[4/5] cards.
        */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-5">
            <div className="relative aspect-[8/5] overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,0.28),transparent_55%),linear-gradient(180deg,rgba(20,23,32,0.92),rgba(10,12,18,0.96))]">
              {hasVideo ? (
                <>
                  <video
                    ref={videoRef}
                    src={featured.resultVideoUrl}
                    poster={featured.sourceImageUrl || undefined}
                    muted={isMuted}
                    playsInline
                    autoPlay
                    loop
                    className="absolute inset-0 h-full w-full object-cover object-center"
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
          </div>
        </div>
      </div>
    </section>
  )
}
