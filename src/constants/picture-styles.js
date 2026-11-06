export const PHOTO_STYLES_MODE = 'photo_styles'

export const PICTURE_STYLES = [
  {
    id: 'coloring_page',
    label: 'Your photo as a coloring page',
    shortLabel: 'Coloring page',
    modalDescription:
      'Black outlines on a clean white page — ready to color in. Same subject and pose, no color fills or photo texture.',
  },
  {
    id: 'cartoon',
    label: 'Your photo as a cartoon',
    shortLabel: 'Cartoon',
    modalDescription:
      'A 3D animated-style character of the same subject — smooth forms, soft light, still recognizable. Not a flat drawing and not a photo.',
  },
  {
    id: 'sticker',
    label: 'Your photo as a sticker',
    shortLabel: 'Sticker',
    modalDescription:
      'A die-cut sticker look: cute illustration, thick white contour, light shadow on a plain field. The original photo background is removed.',
  },
  {
    id: 'clipart',
    label: 'Your photo as clipart',
    shortLabel: 'Clipart',
    modalDescription:
      'Flat vector clipart: bold outlines, solid colors, simple shapes on white. No gradients or photo detail.',
  },
  {
    id: 'professional_snapshot',
    label: 'Your snapshot, made professional',
    shortLabel: 'Studio shot',
    modalDescription:
      'The same subject as a polished studio photo — clean backdrop, controlled light, still photoreal. Not a cartoon or drawing.',
  },
]

export const PICTURE_STYLE_IDS = PICTURE_STYLES.map((style) => style.id)

export const DEFAULT_PICTURE_STYLE = 'coloring_page'

export function getPictureStyleMeta(pictureStyle) {
  return (
    PICTURE_STYLES.find((style) => style.id === pictureStyle) ||
    PICTURE_STYLES[0]
  )
}
