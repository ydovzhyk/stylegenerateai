'use client'

import clsx from 'clsx'

/** Thin dark edge for any text drawn over photos (same params as PreviewBadge). */
export const PHOTO_OVERLAY_TEXT_OUTLINE =
  '[text-shadow:-0.35px_0_0_rgba(0,0,0,0.8),0.35px_0_0_rgba(0,0,0,0.8),0_-0.35px_0_rgba(0,0,0,0.8),0_0.35px_0_rgba(0,0,0,0.8)]'

/** White fill + thin dark edge so badge labels stay readable on light and dark photos. */
const LABEL_OUTLINE = clsx('text-white', PHOTO_OVERLAY_TEXT_OUTLINE)

const TONE_BORDER = {
  neutral: 'border-white/12',
  primary: 'border-primary/25',
  cyan: 'border-cyan-400/25',
}

const VARIANT_CLASS = {
  overlay:
    'inline-flex rounded-full border bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm',
  header:
    'inline-flex min-h-[42px] w-full items-center justify-center rounded-full border bg-white/[0.03] px-3 py-1 text-center text-[11px] uppercase leading-[1.45] tracking-[0.18em]',
}

function ShineSweep() {
  return (
    <span className="pointer-events-none absolute bottom-[-20%] left-[-120%] top-[-20%] z-[1] w-[60%] animate-premium-shine-sweep bg-[linear-gradient(120deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_20%,rgba(255,255,255,0.52)_50%,rgba(255,255,255,0.08)_80%,rgba(255,255,255,0)_100%)] opacity-0" />
  )
}

/**
 * Shared preview / rail badge.
 * @param {'overlay'|'header'} variant - on-photo pill vs pair header chip
 * @param {'neutral'|'primary'|'cyan'} tone - border accent only (label is always white)
 */
export default function PreviewBadge({
  children,
  variant = 'overlay',
  tone = 'neutral',
  shine = false,
  shineSeed,
  className = '',
}) {
  const resolvedTone = TONE_BORDER[tone] ? tone : 'neutral'
  const resolvedVariant = VARIANT_CLASS[variant] ? variant : 'overlay'

  const classes = clsx(
    VARIANT_CLASS[resolvedVariant],
    TONE_BORDER[resolvedTone],
    LABEL_OUTLINE,
    shine && 'relative isolate overflow-hidden',
    className,
  )

  if (!shine) {
    return <span className={classes}>{children}</span>
  }

  return (
    <span key={shineSeed} className={classes}>
      <span className="relative z-[2]">{children}</span>
      <ShineSweep />
    </span>
  )
}
