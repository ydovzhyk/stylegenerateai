export const DEFAULT_RESTORED_PROTOTYPE_ID = 'kyiv'

export const RESTORED_PROTOTYPE_SOURCES = [
  {
    id: 'kyiv',
    label: 'Kyiv',
    src: '/images/restored/kyiv.png',
  },
  {
    id: 'london',
    label: 'London',
    src: '/images/restored/london.png',
  },
  {
    id: 'paris',
    label: 'Paris',
    src: '/images/restored/paris.png',
  },
  {
    id: 'newyork',
    label: 'New York',
    src: '/images/restored/newyork.png',
  },
  {
    id: 'rancho',
    label: 'Rancho',
    src: '/images/restored/rancho.png',
  },
  {
    id: 'lady',
    label: 'Lady',
    src: '/images/restored/lady.png',
  },
]

export function getRestoredPrototypeSource(id = '') {
  const normalizedId = String(id || '').trim().toLowerCase()

  return (
    RESTORED_PROTOTYPE_SOURCES.find((item) => item.id === normalizedId) ||
    RESTORED_PROTOTYPE_SOURCES.find(
      (item) => item.id === DEFAULT_RESTORED_PROTOTYPE_ID,
    ) ||
    RESTORED_PROTOTYPE_SOURCES[0]
  )
}

export function formatRestoreSourceLabel(filenameOrId = '') {
  const raw = String(filenameOrId || '').trim()

  if (!raw) return ''

  const basename = raw.replace(/\.[^.]+$/, '').trim().toLowerCase()
  const preset = RESTORED_PROTOTYPE_SOURCES.find((item) => item.id === basename)

  if (preset) {
    return preset.label
  }

  return basename
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
