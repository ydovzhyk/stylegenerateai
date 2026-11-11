'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'

export default function FullPromptModal({
  open = false,
  title = 'Full prompt',
  prompt = '',
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const text = String(prompt || '').trim()

  return (
    <div
      className={MODAL_OVERLAY_CLASS}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className="flex max-h-[min(82vh,720px)] w-full max-w-[560px] flex-col rounded-[24px] border border-white/10 bg-[#10121a] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <Text as="h3" variant="h3" color="white" caseMode="sentence">
            {title}
          </Text>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close prompt"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/8 bg-white/[0.03] p-4 [scrollbar-gutter:stable]">
          <Text
            as="p"
            variant="body-sm"
            color="white"
            caseMode="sentence"
            translate={false}
            className="whitespace-pre-wrap break-words leading-6"
          >
            {text || 'No prompt'}
          </Text>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="rounded-full px-5"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
