export const GALLERY_SECTIONS = [
  {
    id: 'looks',
    label: 'Looks',
    sourceTypes: ['create_your_look'],
  },
  {
    id: 'photo_lab',
    label: 'Photo Lab',
    sourceTypes: [
      'photo_lab',
      'enhance_quality',
      'bw_to_color',
      'color_to_bw',
    ],
  },
]

export const RESTORE_COLORIZE_MODE = 'restore_colorize'
export const ENHANCE_QUALITY_SOURCE_TYPE = 'enhance_quality'

export function resolveGallerySourceType({
  productKey,
  modeKey,
  restoreStyle,
}) {
  if (productKey !== 'photo_lab') {
    return 'create_your_look'
  }

  const normalizedModeKey = String(modeKey || '').trim()

  if (normalizedModeKey === ENHANCE_QUALITY_SOURCE_TYPE) {
    return ENHANCE_QUALITY_SOURCE_TYPE
  }

  if (normalizedModeKey === RESTORE_COLORIZE_MODE) {
    return restoreStyle === 'restore_only' ? 'bw_to_color' : 'color_to_bw'
  }

  return 'photo_lab'
}

export function getGallerySectionById(sectionId) {
  return GALLERY_SECTIONS.find((section) => section.id === sectionId) || null
}
