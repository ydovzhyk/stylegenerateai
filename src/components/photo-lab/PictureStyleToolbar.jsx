'use client'

import clsx from 'clsx'
import Text from '@/components/shared/text/Text'
import {
  PICTURE_STYLE_IDS,
  getPictureStyleMeta,
} from '@/constants/picture-styles'

export default function PictureStyleToolbar({
  pictureStyle,
  onPictureStyleChange,
  disabled = false,
}) {
  return (
    <div className="overflow-visible rounded-2xl border border-white/10 bg-background-soft/70 p-4">
      <div className="grid grid-cols-2 gap-2">
        {PICTURE_STYLE_IDS.map((styleId) => {
          const meta = getPictureStyleMeta(styleId)
          const active = pictureStyle === styleId

          return (
            <button
              key={styleId}
              type="button"
              onClick={() => onPictureStyleChange(styleId)}
              disabled={disabled}
              className={clsx(
                'flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                active
                  ? 'border-primary/35 bg-primary/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/15',
                disabled && 'cursor-not-allowed opacity-55 hover:border-white/10',
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  'h-4 w-4 shrink-0 rounded-full border',
                  active
                    ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_#12141c]'
                    : 'border-white/40 bg-transparent',
                )}
              />
              <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
                {meta.shortLabel}
              </Text>
            </button>
          )
        })}
      </div>
    </div>
  )
}
