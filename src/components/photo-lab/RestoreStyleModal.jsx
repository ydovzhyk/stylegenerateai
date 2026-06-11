'use client'

import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import {
  RESTORE_STYLE_IDS,
  getRestoreStyleMeta,
} from '@/constants/restore-styles'

export default function RestoreStyleModal({ open, onSelect, onClose }) {
  if (!open) return null

  return (
    <AuthModal
      open={open}
      title="How should we restore your photo?"
      description="Do you want to restore the photo only, or restore it and add natural color?"
      maxWidth="max-w-[520px]"
    >
      <div className="flex flex-col gap-3">
        {RESTORE_STYLE_IDS.map((styleId) => {
          const meta = getRestoreStyleMeta(styleId)

          return (
            <Button
              key={styleId}
              type="button"
              variant={styleId === 'restore_and_colorize' ? 'primary' : 'secondary'}
              className="h-auto min-h-[52px] flex-col items-start rounded-2xl px-4 py-3 text-left"
              onClick={() => onSelect(styleId)}
            >
              <Text as="span" variant="body-sm" color="inherit" caseMode="sentence">
                {meta.label}
              </Text>

              <Text
                as="span"
                variant="caption"
                color="inherit"
                caseMode="sentence"
                className="mt-1 block opacity-80"
              >
                {meta.modalDescription}
              </Text>
            </Button>
          )
        })}
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="ghost"
          className="h-[40px] w-full rounded-full text-white/55 hover:text-white"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </AuthModal>
  )
}
