'use client'

import clsx from 'clsx'
import InfoHint from '@/components/shared/info-hint/InfoHint'
import Text from '@/components/shared/text/Text'
import {
  PICTURE_STYLE_IDS,
  getPictureStyleMeta,
} from '@/constants/picture-styles'

export default function PictureStyleToolbar({
  pictureStyle,
  onPictureStyleChange,
  disabled = false,
  showTitle = false,
  className = '',
}) {
  return (
    <div
      className={clsx('overflow-visible', className)}
    >
      {showTitle ? (
        <Text
          as="p"
          variant="caption"
          color="faint"
          caseMode="sentence"
          className="mb-3 uppercase tracking-[0.18em]"
        >
          Picture style
        </Text>
      ) : null}

      <div className="flex flex-col gap-2">
        {PICTURE_STYLE_IDS.map((styleId) => {
          const meta = getPictureStyleMeta(styleId)
          const active = pictureStyle === styleId

          return (
            <label
              key={styleId}
              className={clsx(
                'flex h-10 min-h-10 cursor-pointer items-center gap-3 overflow-visible rounded-2xl border px-4 py-0 transition',
                active
                  ? 'border-primary/35 bg-primary/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/15',
                disabled && 'cursor-not-allowed opacity-55',
              )}
            >
              <input
                type="radio"
                name="pictureStyle"
                value={styleId}
                checked={active}
                disabled={disabled}
                onChange={() => onPictureStyleChange?.(styleId)}
                className="h-4 w-4 shrink-0 accent-[var(--primary)]"
              />

              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <Text
                  as="span"
                  variant="body-sm"
                  color="soft"
                  caseMode="sentence"
                >
                  {meta.shortLabel}
                </Text>

                <span
                  className="inline-flex shrink-0"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <InfoHint
                    text={meta.modalDescription}
                    label={`More about ${meta.shortLabel}`}
                    align="end"
                    placement="bottom"
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
