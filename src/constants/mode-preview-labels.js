export const MODE_PREVIEW_LABELS = {
  professional_portrait: { before: 'Before', after: 'After' },
  restore_colorize: { before: 'Old photo', after: 'Restored' },
  smart_edit: { before: 'Original', after: 'Edited' },
  remove_objects: { before: 'Distracting', after: 'Clean' },
  enhance_quality: { before: 'Low quality', after: 'Enhanced' },
  creative_retouch: { before: 'Flat', after: 'Cinematic' },
}

export function getModePreviewLabels(modeId = '') {
  return (
    MODE_PREVIEW_LABELS[modeId] || {
      before: 'Before',
      after: 'After',
    }
  )
}
