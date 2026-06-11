export const RESTORE_COLORIZE_MODE = 'restore_colorize'

export const RESTORE_STYLE_IDS = ['restore_only', 'restore_and_colorize']

export const DEFAULT_RESTORE_STYLE = 'restore_and_colorize'

export const RESTORE_STYLE_META = {
  restore_only: {
    label: 'Restore only',
    shortLabel: 'Restore only',
    description: 'Repair damage and improve clarity without adding new color.',
    modalDescription:
      'Repair scratches, fading, and damage while keeping the original black-and-white, sepia, or faded color look.',
  },
  restore_and_colorize: {
    label: 'Restore & colorize',
    shortLabel: 'Restore & colorize',
    description: 'Repair damage and add natural, believable color when appropriate.',
    modalDescription:
      'Repair the photo and add natural, historically believable color for black-and-white or faded images.',
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
