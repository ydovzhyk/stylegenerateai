export const PHOTO_QUALITIES = {
  draft: {
    id: 'draft',
    label: 'Draft',
    apiQuality: 'low',
    outputFormat: 'webp',
    outputCompression: 70,
    promptSuffix:
      'Clean composition, good overall quality, simple detail level.',
    description: 'Fast and lightweight preview.',
  },

  standard: {
    id: 'standard',
    label: 'Standard',
    apiQuality: 'medium',
    outputFormat: 'webp',
    outputCompression: 82,
    promptSuffix:
      'High-quality image, clean details, balanced textures, visually appealing result.',
    description: 'Balanced quality for admin preview.',
  },

  premium: {
    id: 'premium',
    label: 'Premium',
    apiQuality: 'high',
    outputFormat: 'jpeg',
    outputCompression: 92,
    promptSuffix:
      'High-end polished image, refined details, premium presentation quality.',
    description: 'Higher quality with larger file size.',
  },

  print: {
    id: 'print',
    label: 'Print',
    apiQuality: 'high',
    outputFormat: 'png',
    outputCompression: null,
    promptSuffix:
      'Maximum clarity, polished final image, suitable for high-quality export and print use.',
    description: 'Best export quality, largest file size.',
  },
}

export const DEFAULT_PHOTO_QUALITY = 'standard'

export function getPhotoQuality(qualityId) {
  return PHOTO_QUALITIES[qualityId] || PHOTO_QUALITIES[DEFAULT_PHOTO_QUALITY]
}
