'use client'

import clsx from 'clsx'
import InfoHint from '@/components/shared/info-hint/InfoHint'
import Text from '@/components/shared/text/Text'
import {
  RESTORE_STYLE_IDS,
  getRestoreStyleMeta,
} from '@/constants/restore-styles'

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

                <span
                  className="inline-flex shrink-0"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <InfoHint
                    text={meta.modalDescription}
                    label={`More about ${meta.label}`}
                    align="end"
                    widthClassName="w-[min(280px,calc(100vw-48px))]"
                  />
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
