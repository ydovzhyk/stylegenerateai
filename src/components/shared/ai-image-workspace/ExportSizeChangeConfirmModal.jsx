'use client'

import { X } from 'lucide-react'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'

export default function ExportSizeChangeConfirmModal({
  open = false,
  nextLabel = '',
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-[#10121a] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Text as="h3" variant="h3" color="white" caseMode="sentence">
              Generate again for a new size?
            </Text>

            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-2"
            >
              To get a new file size you need to generate the image again. The
              previous result will be removed.
            </Text>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close export size confirmation"
          >
            <X size={16} />
          </button>
        </div>

        {nextLabel ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <Text as="p" variant="body-sm" color="white" caseMode="sentence">
              New export size: {nextLabel}
            </Text>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-full rounded-full px-5"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            className="w-full rounded-full px-5"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
