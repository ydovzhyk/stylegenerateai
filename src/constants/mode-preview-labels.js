/**
 * Photo Lab before/after labels for showcase cards, workspace selection, and comparison badges.
 * Left = source / person / reference. Right = mode result.
 */
/** After badges use the mode title so preview matches the mode picker. */
export const MODE_PREVIEW_LABELS = {
  professional_portrait: {
    before: 'Your photo',
    after: 'Professional Portrait',
  },
  restore_colorize: {
    before: 'Old photo',
    after: 'Restore & Colorize',
  },
  smart_edit: {
    before: 'Your photo',
    after: 'Smart Edit',
  },
  free_prompt: {
    before: 'Your photo',
    after: 'Free Prompt',
  },
  identity_transfer: {
    before: 'Reference photo',
    after: 'Identity Transfer',
  },
  remove_objects: {
    before: 'Your photo',
    after: 'Remove Objects',
  },
  enhance_quality: {
    before: 'Your photo',
    after: 'Enhance Quality',
  },
  creative_retouch: {
    before: 'Your photo',
    after: 'Creative Retouch',
  },
  photo_styles: {
    before: 'Your photo',
    after: 'Photo Styles',
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
