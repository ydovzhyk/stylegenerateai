export const PHOTO_QUALITIES = {
  draft: {
    id: 'draft',
    label: 'Draft',
    description: 'Quick draft generation size.',
  },

  standard: {
    id: 'standard',
    label: 'Standard',
    description: 'Phone-ready generation size for everyday use and sharing.',
  },

  premium: {
    id: 'premium',
    label: 'Premium',
    description:
      'Higher native resolution for wallpapers and small prints.',
  },

  print: {
    id: 'print',
    label: 'Print',
    description:
      'Maximum native resolution (up to ~3840 on the long edge) for posters and archive use.',
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
