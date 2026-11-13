export const PHOTO_QUALITIES = {
  draft: {
    id: 'draft',
    label: 'Draft',
    description: 'Quick draft generation size.',
  },

  standard: {
    id: 'standard',
    label: 'Standard',
    description: 'Phone-ready size for everyday viewing and sharing.',
  },

  premium: {
    id: 'premium',
    label: 'Premium',
    description: 'Computer / monitor resolution for wallpapers and detail.',
  },

  print: {
    id: 'print',
    label: 'Print',
    description:
      'Largest native file for posters and archive (provider max tier).',
    requiresPrintJob: false,
  },
}

export const DEFAULT_PHOTO_QUALITY = 'standard'

/** @deprecated Generate now bills the selected Export size directly. */
export const BILLING_PHOTO_QUALITY = 'draft'

export function getPhotoQuality(qualityId) {
  return PHOTO_QUALITIES[qualityId] || PHOTO_QUALITIES[DEFAULT_PHOTO_QUALITY]
}

export function getPhotoQualityLabel(qualityId) {
  const key = String(qualityId || '').trim().toLowerCase()

  if (!key) return ''

  return PHOTO_QUALITIES[key]?.label || key.charAt(0).toUpperCase() + key.slice(1)
}
