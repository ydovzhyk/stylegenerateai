export const PHOTO_STYLES_MODE = 'photo_styles'

export const PICTURE_STYLES = [
  {
    id: 'coloring_page',
    label: 'Your photo as a coloring page',
    shortLabel: 'Coloring page',
  },
  {
    id: 'cartoon',
    label: 'Your photo as a cartoon',
    shortLabel: 'Cartoon',
  },
  {
    id: 'sticker',
    label: 'Your photo as a sticker',
    shortLabel: 'Sticker',
  },
  {
    id: 'clipart',
    label: 'Your photo as clipart',
    shortLabel: 'Clipart',
  },
  {
    id: 'drawing',
    label: 'Your photo as a drawing',
    shortLabel: 'Drawing',
  },
  {
    id: 'painting',
    label: 'Your photo as a painting',
    shortLabel: 'Painting',
  },
  {
    id: 'professional_snapshot',
    label: 'Your snapshot, made professional',
    shortLabel: 'Studio shot',
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
