/**
 * Photo Lab before/after labels for showcase cards, workspace selection, and comparison badges.
 * Left = source / person / reference. Right = mode result.
 */
export const MODE_PREVIEW_LABELS = {
  professional_portrait: {
    before: 'Your photo',
    after: 'Professional look',
  },
  restore_colorize: {
    before: 'Old photo',
    after: 'Restored photo',
  },
  smart_edit: {
    before: 'Your photo',
    after: 'Edited look',
  },
  identity_transfer: {
    before: 'Reference photo',
    after: 'With your face',
  },
  remove_objects: {
    before: 'Your photo',
    after: 'Clean photo',
  },
  enhance_quality: {
    before: 'Your photo',
    after: 'Enhanced photo',
  },
  creative_retouch: {
    before: 'Your photo',
    after: 'Retouched look',
  },
  photo_styles: {
    before: 'Your photo',
    after: 'Styled photo',
  },
}

export function getModePreviewLabels(modeId = '') {
  return (
    MODE_PREVIEW_LABELS[modeId] || {
      before: 'Your photo',
      after: 'AI result',
    }
  )
}
