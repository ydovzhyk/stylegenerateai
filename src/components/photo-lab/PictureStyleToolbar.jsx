'use client'

import Button from '@/components/shared/button/Button'
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
            <Button
              key={styleId}
              type="button"
              variant="secondary"
              shape="soft"
              active={active}
              disabled={disabled}
              fullWidth
              onClick={() => onPictureStyleChange(styleId)}
              className="justify-start gap-3 px-4 py-3 font-medium"
              leftIcon={
                <span
                  aria-hidden
                  className={
                    active
                      ? 'h-4 w-4 shrink-0 rounded-full border border-primary bg-primary shadow-[inset_0_0_0_3px_#12141c]'
                      : 'h-4 w-4 shrink-0 rounded-full border border-white/40 bg-transparent'
                  }
                />
              }
            >
              {meta.shortLabel}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
