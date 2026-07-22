export const RESTORE_COLORIZE_MODE = 'restore_colorize'

export const RESTORE_STYLE_IDS = ['restore_only', 'restore_and_colorize']

export const DEFAULT_RESTORE_STYLE = 'restore_and_colorize'

export const RESTORE_STYLE_META = {
  restore_only: {
    label: 'Restore only',
    shortLabel: 'Restore only',
    description: 'Repair damage and improve clarity — keep the original tones.',
    modalDescription:
      'Fix scratches, stains, and fading while keeping black-and-white, sepia, or faded color as it was.',
  },
  restore_and_colorize: {
    label: 'Restore & colorize',
    shortLabel: 'Restore & colorize',
    description: 'Repair damage and add natural color when it fits.',
    modalDescription:
      'Repair the photo and bring black-and-white or faded images back with natural, believable color.',
  },
}

export function getRestoreStyleMeta(restoreStyle) {
  return (
    RESTORE_STYLE_META[restoreStyle] ||
    RESTORE_STYLE_META[DEFAULT_RESTORE_STYLE]
  )
}

export function isValidRestoreStyle(value) {
  return RESTORE_STYLE_IDS.includes(value)
}
