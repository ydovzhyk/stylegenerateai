'use client'

import ConfirmModal from '@/components/shared/confirm-modal/ConfirmModal'

export default function ExportSizeChangeConfirmModal({
  open = false,
  nextLabel = '',
  onCancel,
  onConfirm,
}) {
  return (
    <ConfirmModal
      open={open}
      title="Generate again for a new size?"
      description="To get a new file size you need to generate the image again. The previous result will be removed."
      detail={nextLabel ? `New export size: ${nextLabel}` : null}
      confirmLabel="Continue"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      closeAriaLabel="Close export size confirmation"
    />
  )
}
