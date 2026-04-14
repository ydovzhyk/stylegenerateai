'use client'

import { useEffect, useMemo, useState } from 'react'
import Text from '@/components/shared/text/Text'

const PROTOTYPE_KEY_MAP = {
  man_front_color: '/images/photo-prototype/men-color.png',
  man_front_black: '/images/photo-prototype/men-black.png',
  man_profile_color: '/images/photo-prototype/men-color-profile.png',
  man_profile_black: '/images/photo-prototype/men-black-profile.png',
  woman_front_color: '/images/photo-prototype/women-color.png',
  woman_front_black: '/images/photo-prototype/women-black.png',
  woman_profile_color: '/images/photo-prototype/women-color-profile.png',
  woman_profile_black: '/images/photo-prototype/women-black-profile.png',
}

const ROTATE_MS = 4500

function resolvePrototypeSrc(previewSourceKey) {
  return PROTOTYPE_KEY_MAP[previewSourceKey] || ''
}

function getGenderFromSourceKey(previewSourceKey) {
  if (String(previewSourceKey || '').startsWith('man_')) return 'man'
  if (String(previewSourceKey || '').startsWith('woman_')) return 'woman'
  return ''
}

function normalizeTemplates(items = []) {
  return items
    .filter((item) => item?.previewUrl && item?.previewSourceKey)
    .map((item) => ({
      ...item,
      prototypeSrc: resolvePrototypeSrc(item.previewSourceKey),
      gender: getGenderFromSourceKey(item.previewSourceKey),
    }))
    .filter((item) => item.prototypeSrc && item.gender)
}

function pickSafeIndex(items, index) {
  if (!items.length) return 0
  return index % items.length
}

function TransformationCard({ title, eyebrow, item, isEmpty = false }) {
  if (isEmpty || !item) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5 md:p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative">
          <Text
            as="p"
            variant="caption"
            color="faint"
            className="uppercase tracking-[0.22em]"
          >
            {eyebrow}
          </Text>

          <Text
            as="h3"
            variant="h3"
            color="white"
            caseMode="sentence"
            className="mt-3"
          >
            {title}
          </Text>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-dashed border-white/10 bg-background-soft/70 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                  Original
                </span>
              </div>

              <div className="flex aspect-[4/5] items-center justify-center rounded-[18px] bg-background text-center">
                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                >
                  No source preview yet
                </Text>
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-white/10 bg-background-soft/70 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary-soft">
                  Generated
                </span>
              </div>

              <div className="flex aspect-[4/5] items-center justify-center rounded-[18px] bg-background text-center">
                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                >
                  Create Your Look preview will appear here
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-violet-soft transition duration-300 hover:-translate-y-0.5 hover:border-primary/20 sm:p-5 md:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Text
              as="p"
              variant="caption"
              color="faint"
              className="uppercase tracking-[0.22em]"
            >
              {eyebrow}
            </Text>

            <Text
              as="h3"
              variant="h3"
              color="white"
              caseMode="sentence"
              className="mt-3"
            >
              {title}
            </Text>
          </div>

          {item.category ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-soft">
              {item.category}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <div className="rounded-[24px] border border-white/10 bg-background-soft/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                Original
              </span>
            </div>

            <div className="overflow-hidden rounded-[18px] bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.prototypeSrc}
                alt={`${item.title || 'Template'} source preview`}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="relative flex h-full min-h-[240px] items-center justify-center px-1">
              <div className="absolute inset-y-5 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/60 to-transparent" />
              <div className="relative rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary-soft backdrop-blur-sm">
                AI
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-primary/15 bg-primary/[0.04] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary-soft">
                Generated
              </span>
            </div>

            <div className="overflow-hidden rounded-[18px] bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.title || 'Generated template preview'}
                className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text as="p" variant="body" color="white" caseMode="sentence">
              {item.title}
            </Text>

            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-1"
            >
              Real prototype source paired with a curated AI transformation.
            </Text>
          </div>

          {Array.isArray(item.tags) && item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 sm:max-w-[42%] sm:justify-end">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function CreateYourLookPreview({ items = [] }) {
  const normalizedItems = useMemo(() => normalizeTemplates(items), [items])

  const maleTemplates = useMemo(() => {
    return normalizedItems.filter((item) => item.gender === 'man')
  }, [normalizedItems])

  const femaleTemplates = useMemo(() => {
    return normalizedItems.filter((item) => item.gender === 'woman')
  }, [normalizedItems])

  const [maleIndex, setMaleIndex] = useState(0)
  const [femaleIndex, setFemaleIndex] = useState(0)

  useEffect(() => {
    if (maleTemplates.length <= 1 && femaleTemplates.length <= 1) return

    const interval = setInterval(() => {
      if (maleTemplates.length > 1) {
        setMaleIndex((prev) => (prev + 1) % maleTemplates.length)
      }

      if (femaleTemplates.length > 1) {
        setFemaleIndex((prev) => (prev + 1) % femaleTemplates.length)
      }
    }, ROTATE_MS)

    return () => clearInterval(interval)
  }, [maleTemplates.length, femaleTemplates.length])

  const currentMaleTemplate =
    maleTemplates[pickSafeIndex(maleTemplates, maleIndex)] || null

  const currentFemaleTemplate =
    femaleTemplates[pickSafeIndex(femaleTemplates, femaleIndex)] || null

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-orb left-[-60px] top-[10%] h-[180px] w-[180px] opacity-40 blur-3xl sm:h-[260px] sm:w-[260px]" />
        <div className="hero-orb bottom-[-40px] right-[-20px] h-[180px] w-[180px] opacity-30 blur-3xl sm:h-[240px] sm:w-[240px]" />
      </div>

      <div className="relative rounded-[32px] border border-white/10 bg-background-soft/40 p-4 sm:p-5 md:p-6 lg:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 md:mb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Text
              as="p"
              variant="caption"
              color="faint"
              className="uppercase tracking-[0.22em] text-primary-soft"
            >
              live preview
            </Text>

            <Text
              as="h2"
              variant="h2"
              color="white"
              caseMode="sentence"
              className="mt-3"
            >
              See how a single photo transforms into a new visual identity
            </Text>

            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-3 max-w-xl"
            >
              Browse real before-and-after examples powered by curated AI
              templates used on the platform.
            </Text>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-soft">
              Auto-rotating
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary-soft">
              Curated styles
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <TransformationCard
            eyebrow="Male preview"
            title="Generated from real prototype source"
            item={currentMaleTemplate}
            isEmpty={!currentMaleTemplate}
          />

          <TransformationCard
            eyebrow="Female preview"
            title="Generated from real prototype source"
            item={currentFemaleTemplate}
            isEmpty={!currentFemaleTemplate}
          />
        </div>
      </div>
    </section>
  )
}
