export const PHOTO_QUALITIES = {
  draft: {
    id: 'draft',
    label: 'Draft',
    description: 'Lightweight preview file for quick checks and sharing in chat.',
  },

  standard: {
    id: 'standard',
    label: 'Standard',
    description:
      'Everyday download at your photo size — balanced file weight and clarity.',
  },

  premium: {
    id: 'premium',
    label: 'Premium',
    description:
      'High-quality JPEG at full photo size for saving and editing.',
  },

  print: {
    id: 'print',
    label: 'Print',
    description:
      '2× upscale to PNG for large prints, posters, and archive use.',
  },
}

export const DEFAULT_PHOTO_QUALITY = 'standard'

export function getPhotoQuality(qualityId) {
  return PHOTO_QUALITIES[qualityId] || PHOTO_QUALITIES[DEFAULT_PHOTO_QUALITY]
}
