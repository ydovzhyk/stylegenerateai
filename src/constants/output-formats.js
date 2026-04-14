export const OUTPUT_FORMATS = {
  portrait_2_3: {
    id: 'portrait_2_3',
    label: 'Portrait 2:3',
    aspectRatio: '2:3',
    width: 1024,
    height: 1536,
    previewAspectClass: 'aspect-[2/3]',
  },
  square_1_1: {
    id: 'square_1_1',
    label: 'Square 1:1',
    aspectRatio: '1:1',
    width: 1024,
    height: 1024,
    previewAspectClass: 'aspect-square',
  },
  landscape_3_2: {
    id: 'landscape_3_2',
    label: 'Landscape 3:2',
    aspectRatio: '3:2',
    width: 1536,
    height: 1024,
    previewAspectClass: 'aspect-[3/2]',
  },
}

export const DEFAULT_OUTPUT_FORMAT = 'portrait_2_3'

export function getOutputFormat(formatId) {
  return OUTPUT_FORMATS[formatId] || OUTPUT_FORMATS[DEFAULT_OUTPUT_FORMAT]
}
