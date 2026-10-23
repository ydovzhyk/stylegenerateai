'use client'

import clsx from 'clsx'
import { Info } from 'lucide-react'
import { useTranslate } from '@/utils/translate/translate'

const ALIGN_CLASS = {
  center: 'left-1/2 -translate-x-1/2',
  start: 'left-0',
  end: 'right-0',
}

function TipBubble({
  children,
  align = 'center',
  tone = 'muted',
  widthClassName = 'w-[210px]',
  textAlign = 'left',
  showOnFocus = false,
}) {
  return (
    <span
      className={clsx(
        'pointer-events-none absolute bottom-full z-20 mb-3 rounded-2xl border border-white/10 bg-[#151821] px-3 py-2 text-xs leading-relaxed opacity-0 shadow-2xl shadow-black/30 transition-opacity group-hover/info-tip:opacity-100',
        showOnFocus && 'group-focus-within/info-tip:opacity-100',
        ALIGN_CLASS[align] || ALIGN_CLASS.center,
        widthClassName,
        textAlign === 'center' ? 'text-center' : 'text-left',
        tone === 'accent' ? 'text-cyan-300' : 'text-muted',
      )}
    >
      {children}
    </span>
  )
}

/** Wrap any control with the shared hover tooltip bubble. */
export function HoverTip({
  text,
  children,
  align = 'center',
  tone = 'accent',
  widthClassName = 'w-[210px]',
  textAlign = 'left',
  showOnFocus = false,
  translate = true,
  className = '',
}) {
  const translatedText = useTranslate(text, { caseMode: 'sentence' })
  const content = translate ? translatedText : text

  if (!content) return children || null

  // Outer takes layout/positioning (absolute, w-full, …); inner stays relative for the tip
  // so Tailwind `relative` never overrides a caller's `absolute`.
  const fillWidth = /\bw-full\b/.test(className || '')

  return (
    <span className={className || undefined}>
      <span
        className={clsx(
          'group/info-tip relative',
          fillWidth ? 'flex w-full' : 'inline-flex',
        )}
      >
        {children}
        <TipBubble
          align={align}
          tone={tone}
          widthClassName={widthClassName}
          textAlign={textAlign}
          showOnFocus={showOnFocus}
        >
          {content}
        </TipBubble>
      </span>
    </span>
  )
}

/** Shared Info icon + tooltip used across Imagine, Photo Lab, and action cards. */
export default function InfoHint({
  text,
  label = 'More info',
  align = 'center',
  tone = 'muted',
  widthClassName = 'w-[210px]',
  textAlign = 'left',
  translate = true,
  className = '',
}) {
  return (
    <HoverTip
      text={text}
      align={align}
      tone={tone}
      widthClassName={widthClassName}
      textAlign={textAlign}
      translate={translate}
      className={clsx(
        'inline-flex cursor-pointer text-muted transition-colors hover:text-cyan-300',
        className,
      )}
    >
      <Info size={14} aria-label={label} />
    </HoverTip>
  )
}
