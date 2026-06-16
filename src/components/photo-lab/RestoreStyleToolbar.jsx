'use client'

import clsx from 'clsx'
import { CircleHelp } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import {
  RESTORE_STYLE_IDS,
  getRestoreStyleMeta,
} from '@/constants/restore-styles'

function RestoreStyleTooltip({ text, children, className = '' }) {
  return (
    <span className={`group/restore-tip relative inline-flex ${className}`}>
      {children}
      <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-3 w-[min(280px,calc(100vw-48px))] rounded-2xl border border-white/10 bg-[#151821] px-3 py-2 text-left text-xs leading-relaxed text-cyan-300 opacity-0 shadow-2xl shadow-black/30 transition-opacity group-hover/restore-tip:opacity-100 group-focus-within/restore-tip:opacity-100">
        {text}
      </span>
    </span>
  )
}

export default function RestoreStyleToolbar({
  restoreStyle,
  onRestoreStyleChange,
  disabled = false,
  showTitle = true,
  className = '',
}) {
  return (
    <div
      className={clsx(
        'overflow-visible rounded-2xl border border-white/10 bg-background-soft/70 p-4',
        className,
      )}
    >
      {showTitle ? (
        <Text
          as="p"
          variant="caption"
          color="faint"
          caseMode="sentence"
          className="mb-3 uppercase tracking-[0.18em]"
        >
          Restore type
        </Text>
      ) : null}

      <div className="flex flex-col gap-2">
        {RESTORE_STYLE_IDS.map((styleId) => {
          const meta = getRestoreStyleMeta(styleId)
          const active = restoreStyle === styleId

          return (
            <label
              key={styleId}
              className={clsx(
                'flex cursor-pointer items-center gap-3 overflow-visible rounded-2xl border px-4 py-3 transition',
                active
                  ? 'border-primary/35 bg-primary/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/15',
                disabled && 'cursor-not-allowed opacity-55',
              )}
            >
              <input
                type="radio"
                name="restoreStyle"
                value={styleId}
                checked={active}
                disabled={disabled}
                onChange={() => onRestoreStyleChange(styleId)}
                className="h-4 w-4 shrink-0 accent-[var(--primary)]"
              />

              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
                  {meta.label}
                </Text>

                <RestoreStyleTooltip text={meta.modalDescription}>
                  <span
                    tabIndex={0}
                    role="note"
                    aria-label={`More about ${meta.label}`}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:border-cyan-400/30 hover:text-cyan-300"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <CircleHelp size={14} />
                  </span>
                </RestoreStyleTooltip>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
