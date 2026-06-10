export const PHOTO_QUALITIES = {
  draft: {
    id: 'draft',
    label: 'Draft',
    apiQuality: 'low',
    outputFormat: 'webp',
    outputCompression: 70,
    description: 'Fast preview export with lighter compression.',
  },

  standard: {
    id: 'standard',
    label: 'Standard',
    apiQuality: 'medium',
    outputFormat: 'webp',
    outputCompression: 82,
    description: 'Balanced export density for everyday use.',
  },

  premium: {
    id: 'premium',
    label: 'Premium',
    apiQuality: 'high',
    outputFormat: 'jpeg',
    outputCompression: 92,
    description: 'Higher export density with refined JPEG output.',
  },

  print: {
    id: 'print',
    label: 'Print',
    apiQuality: 'high',
    outputFormat: 'png',
    outputCompression: null,
    description: 'Lossless PNG export for print and archive.',
  },
}

export const DEFAULT_PHOTO_QUALITY = 'draft'

export function getPhotoQuality(qualityId) {
  return PHOTO_QUALITIES[qualityId] || PHOTO_QUALITIES[DEFAULT_PHOTO_QUALITY]
}
