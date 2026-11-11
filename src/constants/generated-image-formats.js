export const GENERATED_IMAGE_FORMATS = {
  png: {
    id: 'png',
    label: 'PNG',
    mimeType: 'image/png',
    extension: 'png',
    description: 'Best quality',
  },

  jpeg: {
    id: 'jpeg',
    label: 'JPG',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    description: 'Smaller file',
  },

  webp: {
    id: 'webp',
    label: 'WEBP',
    mimeType: 'image/webp',
    extension: 'webp',
    description: 'Modern format',
  },

  mp4: {
    id: 'mp4',
    label: 'MP4',
    mimeType: 'video/mp4',
    extension: 'mp4',
    description: 'Video clip',
  },
}

export const DEFAULT_GENERATED_IMAGE_FORMAT = 'png'

export function getGeneratedImageFormat(formatId) {
  return (
    GENERATED_IMAGE_FORMATS[formatId] ||
    GENERATED_IMAGE_FORMATS[DEFAULT_GENERATED_IMAGE_FORMAT]
  )
}
