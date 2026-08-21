export const MODE_PREVIEW_LABELS = {
  professional_portrait: { before: 'Casual', after: 'LinkedIn-ready' },
  restore_colorize: { before: 'Old photo', after: 'Restored' },
  smart_edit: { before: 'Original', after: 'Edited' },
  identity_transfer: { before: 'Reference', after: 'Your face' },
  remove_objects: { before: 'Distracting', after: 'Clean' },
  enhance_quality: { before: 'Soft', after: 'Clearer' },
  creative_retouch: { before: 'Everyday', after: 'Instagram-ready' },
}

export function getModePreviewLabels(modeId = '') {
  return (
    MODE_PREVIEW_LABELS[modeId] || {
      before: 'Before',
      after: 'After',
    }
  )
}
