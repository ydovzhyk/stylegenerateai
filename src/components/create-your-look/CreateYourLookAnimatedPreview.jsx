'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslate } from '@/utils/translate/translate'
import Text from '@/components/shared/text/Text'

const PROTOTYPE_BY_KEY = {
  man_front_color: '/images/photo-prototype/men-color.png',
  man_front_black: '/images/photo-prototype/men-black.png',
  man_profile_color: '/images/photo-prototype/men-color-profile.png',
  man_profile_black: '/images/photo-prototype/men-black-profile.png',
  woman_front_color: '/images/photo-prototype/women-color.png',
  woman_front_black: '/images/photo-prototype/women-black.png',
  woman_profile_color: '/images/photo-prototype/women-color-profile.png',
  woman_profile_black: '/images/photo-prototype/women-black-profile.png',
}

const CARD_ROTATE_MS = 8200

function mapPreviewItem(item) {
  const previewSourceKey = String(item?.previewSourceKey || '').trim()

  return {
    id:
      item?._id ||
      item?.slug ||
      `${previewSourceKey}-${String(item?.previewUrl || '')}-${String(item?.title || '')}`,
    title: String(item?.title || '').trim(),
    category: String(item?.category || '').trim(),
    beforeSrc: PROTOTYPE_BY_KEY[previewSourceKey] || '',
    afterSrc: String(item?.previewUrl || '').trim(),
    previewSourceKey,
    gender: previewSourceKey.startsWith('man_') ? 'man' : 'woman',
  }
}

function buildMobileSequence(manItems = [], womanItems = []) {
  const result = []
  const maxLen = Math.max(manItems.length, womanItems.length)

  for (let i = 0; i < maxLen; i += 1) {
    if (manItems[i]) result.push(manItems[i])
    if (womanItems[i]) result.push(womanItems[i])
  }

  return result
}

function ShinyBadge({ children, className = '', shineSeed }) {
  return (
    <span
      key={shineSeed}
      className={`relative inline-flex isolate overflow-hidden ${className}`}
    >
      <span className="relative z-[2]">{children}</span>

      <span className="pointer-events-none absolute bottom-[-20%] left-[-120%] top-[-20%] z-[1] w-[60%] animate-premium-shine-sweep bg-[linear-gradient(120deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_20%,rgba(255,255,255,0.52)_50%,rgba(255,255,255,0.08)_80%,rgba(255,255,255,0)_100%)] opacity-0" />
    </span>
  )
}

function getAccentClasses(accent = 'primary') {
  return {
    accentGlow: accent === 'primary' ? 'bg-primary/12' : 'bg-cyan-400/12',
    accentBorder:
      accent === 'primary' ? 'border-primary/20' : 'border-cyan-400/20',
    accentText: accent === 'primary' ? 'text-primary-soft' : 'text-cyan-300',
  }
}

function useRotatingIndex(length, delay) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [length])

  useEffect(() => {
    if (length <= 1) return

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % length)
    }, delay)

    return () => clearInterval(timer)
  }, [length, delay])

  return index
}

function AnimatedSwapText({
  text,
  className = '',
  type = 'default',
  children,
}) {
  const reducedMotion = useReducedMotion()

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${type}-${text}`}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 10, filter: 'blur(6px)' }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, filter: 'blur(0px)' }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -8, filter: 'blur(6px)' }
          }
          transition={{
            duration: reducedMotion ? 0.15 : 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StaticImage({ src, alt, objectPosition = 'center' }) {
  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition }}
    />
  )
}

function AnimatedAfterImage({
  src,
  alt,
  animationKey,
  objectPosition = 'center',
}) {
  const reducedMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-background-soft/80" />

      <AnimatePresence initial={false}>
        <motion.img
          key={animationKey}
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition }}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  scale: 1.06,
                  y: 14,
                  filter: 'blur(4px)',
                }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  filter: 'blur(0px)',
                }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  scale: 0.995,
                  y: -2,
                  filter: 'blur(3px)',
                }
          }
          transition={{
            duration: reducedMotion ? 0.12 : 0.85,
            delay: 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </AnimatePresence>
    </div>
  )
}

function BeforeImagePanel({ src, alt }) {
  const beforeText = useTranslate('Before', { caseMode: 'title' })

  return (
    <div className="relative min-h-[280px] border-r border-white/10 bg-background-soft/70 sm:min-h-[360px] lg:min-h-[420px]">
      <StaticImage src={src} alt={alt} objectPosition="center" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/70 via-black/15 to-transparent px-4 pb-4 pt-12">
        <span className="inline-flex rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
          {beforeText}
        </span>
      </div>
    </div>
  )
}

function AfterImagePanel({
  src,
  alt,
  imageKey,
  accentBorder,
  accentText,
  shineSeed,
}) {
  const afterText = useTranslate('After', { caseMode: 'title' })

  return (
    <div className="relative min-h-[280px] bg-background-soft/70 sm:min-h-[360px] lg:min-h-[420px]">
      <AnimatedAfterImage
        src={src}
        alt={alt}
        animationKey={imageKey}
        objectPosition="center"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/70 via-black/15 to-transparent px-4 pb-4 pt-12">
        <ShinyBadge
          shineSeed={`after-${shineSeed}`}
          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm ${accentBorder} ${accentText} bg-black/25`}
        >
          {afterText}
        </ShinyBadge>
      </div>
    </div>
  )
}

function PreviewCard({ item, accent = 'primary', contentKey }) {
  if (!item) return null

  const { accentGlow, accentBorder, accentText } = getAccentClasses(accent)

  const malePreviewText = useTranslate('male preview', { caseMode: 'lower' })
  const femalePreviewText = useTranslate('female preview', {
    caseMode: 'lower',
  })
  const aiTransformationText = useTranslate('AI transformation', {
    caseMode: 'none',
  })
  const beforeAltText = useTranslate('before', { caseMode: 'lower' })
  const afterAltText = useTranslate('after', { caseMode: 'lower' })

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute left-[-8%] top-[-10%] h-36 w-36 rounded-full blur-3xl ${accentGlow}`}
        />
        <div className="absolute bottom-[-12%] right-[-10%] h-32 w-32 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative border-b border-white/10 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${accentBorder} ${accentText} bg-white/[0.03]`}
          >
            {item.gender === 'man' ? malePreviewText : femalePreviewText}
          </span>

          <ShinyBadge
            shineSeed={`ai-${contentKey}`}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55"
          >
            {aiTransformationText}
          </ShinyBadge>
        </div>

        <AnimatedSwapText type="title" text={item.title}>
          <Text
            as="h3"
            variant="body"
            color="white"
            caseMode="sentence"
            className="truncate"
          >
            {item.title}
          </Text>
        </AnimatedSwapText>

        <div className="mt-1 min-h-[20px]">
          {item.category ? (
            <AnimatedSwapText type="category" text={item.category}>
              <Text as="p" variant="caption" color="muted" caseMode="sentence">
                {item.category}
              </Text>
            </AnimatedSwapText>
          ) : null}
        </div>
      </div>

      <div className="relative grid grid-cols-2">
        <BeforeImagePanel
          src={item.beforeSrc}
          alt={`${item.title} ${beforeAltText}`}
        />

        <AfterImagePanel
          src={item.afterSrc}
          alt={`${item.title} ${afterAltText}`}
          imageKey={`after-${contentKey}-${item.afterSrc}`}
          accentBorder={accentBorder}
          accentText={accentText}
          shineSeed={contentKey}
        />

        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-white/12" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/35 text-[11px] uppercase tracking-[0.18em] text-white/75 backdrop-blur-md">
          AI
        </div>
      </div>
    </div>
  )
}

export default function CreateYourLookAnimatedPreview({
  previewGroups = { man: [], woman: [] },
}) {
  const manItems = useMemo(
    () =>
      (previewGroups?.man || [])
        .map(mapPreviewItem)
        .filter((item) => item.beforeSrc && item.afterSrc),
    [previewGroups],
  )

  const womanItems = useMemo(
    () =>
      (previewGroups?.woman || [])
        .map(mapPreviewItem)
        .filter((item) => item.beforeSrc && item.afterSrc),
    [previewGroups],
  )

  const mobileItems = useMemo(
    () => buildMobileSequence(manItems, womanItems),
    [manItems, womanItems],
  )

  const manIndex = useRotatingIndex(manItems.length, CARD_ROTATE_MS)
  const womanIndex = useRotatingIndex(womanItems.length, CARD_ROTATE_MS)
  const mobileIndex = useRotatingIndex(mobileItems.length, CARD_ROTATE_MS)

  const activeMan = manItems[manIndex] || null
  const activeWoman = womanItems[womanIndex] || null
  const activeMobile = mobileItems[mobileIndex] || null

  if (!activeMobile && !activeMan && !activeWoman) return null

  return (
    <section>
      <div className="md:hidden">
        <PreviewCard
          item={activeMobile}
          accent={activeMobile?.gender === 'man' ? 'primary' : 'cyan'}
          contentKey={`${activeMobile?.id}-${mobileIndex}`}
        />
      </div>

      <div className="hidden gap-6 md:grid md:grid-cols-2">
        <PreviewCard
          item={activeMan}
          accent="primary"
          contentKey={`${activeMan?.id}-${manIndex}`}
        />

        <PreviewCard
          item={activeWoman}
          accent="cyan"
          contentKey={`${activeWoman?.id}-${womanIndex}`}
        />
      </div>
    </section>
  )
}
