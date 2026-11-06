'use client'

import { X } from 'lucide-react'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import {
  MODAL_OVERLAY_CLASS,
  MODAL_OVERLAY_ELEVATED_CLASS,
} from '@/constants/modal-overlay'

export default function ConfirmModal({
  open = false,
  title,
  description = '',
  detail = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmLoading = false,
  confirmDisabled = false,
  cancelDisabled = false,
  elevated = false,
  closeAriaLabel = 'Close confirmation',
  confirmVariant = 'primary',
}) {
  if (!open) return null

  const busy = Boolean(confirmLoading)
  const canCancel = !busy && !cancelDisabled
  const canConfirm = !busy && !confirmDisabled

  return (
    <div className={elevated ? MODAL_OVERLAY_ELEVATED_CLASS : MODAL_OVERLAY_CLASS}>
      <div className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-[#10121a] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Text as="h3" variant="h3" color="white" caseMode="sentence">
              {title}
            </Text>

            {description ? (
              <Text
                as="p"
                variant="body-sm"
                color="muted"
                caseMode="sentence"
                className="mt-2"
              >
                {description}
              </Text>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={!canCancel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={closeAriaLabel}
          >
            <X size={16} />
          </button>
        </div>

        {detail ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            {typeof detail === 'string' ? (
              <Text as="p" variant="body-sm" color="white" caseMode="sentence">
                {detail}
              </Text>
            ) : (
              detail
            )}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={!canCancel}
            className="w-full rounded-full px-5"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            loading={busy}
            disabled={!canConfirm}
            className="w-full rounded-full px-5"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
