'use client'

import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/shared/button/Button'

export default function GenerationCloserPresetModal({
  open,
  creditDelta = 0,
  loading = false,
  onApply,
  onDecline,
}) {
  const deltaLabel = `${creditDelta} credit${creditDelta === 1 ? '' : 's'}`

  return (
    <AuthModal
      open={open}
      title="Keep closer to your photo?"
      description={`We can apply Closer to original mode for this generation. This adds ${deltaLabel}.`}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          className="h-[44px] flex-1 rounded-full"
          disabled={loading}
          onClick={onDecline}
        >
          No, use Default
        </Button>

        <Button
          type="button"
          variant="primary"
          className="h-[44px] flex-1 rounded-full"
          loading={loading}
          disabled={loading}
          onClick={onApply}
        >
          Apply
        </Button>
      </div>
    </AuthModal>
  )
}
