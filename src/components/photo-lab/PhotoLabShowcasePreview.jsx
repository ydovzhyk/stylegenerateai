'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import Text from '@/components/shared/text/Text'

const ROTATE_MS = 4200

const SHOWCASE_ITEMS = [
  {
    id: 'professional_portrait',
    beforeLabel: 'Before',
    afterLabel: 'Professional',
    title: 'LinkedIn-ready portrait',
    description: 'Clean studio light, better outfit, polished background.',
    beforeGradient: 'from-slate-700/70 via-slate-900/80 to-black',
    afterGradient: 'from-primary/70 via-cyan-500/30 to-slate-950',
  },
  {
    id: 'restore_colorize',
    beforeLabel: 'Old photo',
    afterLabel: 'Restored',
    title: 'Restore family memories',
    description: 'Repair damage, improve details, and add natural color.',
    beforeGradient: 'from-zinc-700/70 via-stone-900/80 to-black',
    afterGradient: 'from-amber-300/45 via-primary/35 to-slate-950',
  },
  {
    id: 'smart_edit',
    beforeLabel: 'Original',
    afterLabel: 'Edited',
    title: 'Change outfit or scene',
    description: 'Modify clothing, objects, lighting, and background.',
    beforeGradient: 'from-slate-800/80 via-slate-950 to-black',
    afterGradient: 'from-cyan-400/40 via-primary/45 to-slate-950',
  },
  {
    id: 'remove_objects',
    beforeLabel: 'Distracting',
    afterLabel: 'Clean',
    title: 'Remove unwanted objects',
    description: 'Clean visual noise and keep the photo natural.',
    beforeGradient: 'from-rose-400/30 via-slate-900 to-black',
    afterGradient: 'from-emerald-300/35 via-cyan-500/25 to-slate-950',
  },
  {
    id: 'enhance_quality',
    beforeLabel: 'Low quality',
    afterLabel: 'Enhanced',
    title: 'Sharpen blurry photos',
    description: 'Improve lighting, clarity, texture, and details.',
    beforeGradient: 'from-slate-700/60 via-slate-950 to-black',
    afterGradient: 'from-emerald-300/35 via-cyan-400/35 to-slate-950',
  },
  {
    id: 'creative_retouch',
    beforeLabel: 'Flat',
    afterLabel: 'Cinematic',
    title: 'Creative retouch',
    description: 'Add premium color grading and a polished visual mood.',
    beforeGradient: 'from-neutral-700/60 via-slate-950 to-black',
    afterGradient: 'from-fuchsia-400/35 via-primary/40 to-slate-950',
  },
]

export default function PhotoLabShowcasePreview({ selectedMode }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const orderedItems = useMemo(() => {
    const selectedIndex = SHOWCASE_ITEMS.findIndex(
      (item) => item.id === selectedMode?.id,
    )

    if (selectedIndex <= 0) return SHOWCASE_ITEMS

    return [
      SHOWCASE_ITEMS[selectedIndex],
      ...SHOWCASE_ITEMS.filter((_, index) => index !== selectedIndex),
    ]
  }, [selectedMode?.id])

  const activeItem = orderedItems[activeIndex % orderedItems.length]

  useEffect(() => {
    setActiveIndex(0)
  }, [selectedMode?.id])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % orderedItems.length)
    }, ROTATE_MS)

    return () => window.clearInterval(timerId)
  }, [orderedItems.length])

  return (
    <section className="gradient-border-card overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="p-2 sm:p-3">
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
            {activeItem.title}
          </Text>

          <Text
            as="p"
            variant="body-sm"
            color="muted"
            caseMode="sentence"
            className="mt-3 max-w-xl leading-6"
          >
            {activeItem.description}
          </Text>

          <div className="mt-5 flex flex-wrap gap-2">
            {orderedItems.map((item, index) => {
              const active = index === activeIndex

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-xs transition',
                    active
                      ? 'border-primary/50 bg-primary/15 text-white'
                      : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-cyan-400/30 hover:text-white',
                  )}
                >
                  {item.afterLabel}
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/10 bg-black/30 p-4 sm:min-h-[420px]">
          <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-primary/20 blur-[70px]" />
          <div className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-cyan-400/15 blur-[80px]" />

          <div className="relative grid h-full min-h-[330px] gap-4 sm:grid-cols-2 sm:items-center">
            <PreviewCard
              label={activeItem.beforeLabel}
              title="Original"
              gradient={activeItem.beforeGradient}
              muted
            />

            <PreviewCard
              label={activeItem.afterLabel}
              title="AI result"
              gradient={activeItem.afterGradient}
              featured
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function PreviewCard({ label, title, gradient, muted, featured }) {
  return (
    <div
      className={clsx(
        'relative min-h-[280px] overflow-hidden rounded-[28px] border p-4 transition duration-500',
        featured
          ? 'border-cyan-400/25 bg-white/[0.06] shadow-[0_20px_70px_rgba(0,0,0,0.42)]'
          : 'border-white/10 bg-white/[0.03]',
      )}
    >
      <div className={clsx('absolute inset-0 bg-gradient-to-br', gradient)} />

      <div
        className={clsx(
          'absolute inset-x-8 top-10 h-28 rounded-full blur-2xl',
          featured ? 'bg-white/20' : 'bg-white/8',
        )}
      />

      <div className="relative z-[1] flex h-full min-h-[248px] flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/70">
            {label}
          </span>

          {featured ? (
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              AI
            </span>
          ) : null}
        </div>

        <div className="mx-auto flex h-36 w-28 items-end justify-center rounded-full border border-white/10 bg-black/20 p-2">
          <div
            className={clsx(
              'h-28 w-20 rounded-t-full rounded-b-[22px] border border-white/10',
              muted ? 'bg-white/10 blur-[1px]' : 'bg-white/25',
            )}
          />
        </div>

        <div>
          <Text as="h3" variant="body" color="white" caseMode="sentence">
            {title}
          </Text>

          <Text
            as="p"
            variant="caption"
            color="muted"
            caseMode="sentence"
            className="mt-1"
          >
            {featured ? 'Cleaner, sharper, studio-ready' : 'Uploaded photo'}
          </Text>
        </div>
      </div>
    </div>
  )
}
