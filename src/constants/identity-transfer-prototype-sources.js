const IDENTITY_TRANSFER_IMAGE_DIR = '/images/identity-transfer'

const IDENTITY_TRANSFER_SOURCE_IDS = [
  'female-black-white-bed-portrait',
  'female-blonde-balcony-leather-jacket',
  'female-cafe-summer-dress',
  'female-dj-leopard-outfit',
  'female-fashion-doorway-leopard-swimsuit',
  'female-mirror-selfie-brown-top-skirt',
  'female-studio-brown-streetwear',
  'female-urban-beige-suit',
  'female-urban-black-halter-dress',
  'male-cafe-varsity-jacket-coffee',
  'male-cafe-white-shirt-portrait',
  'male-coastal-road-classic-car',
]

const SKIP_TOKENS = new Set([
  'portrait',
  'outfit',
  'fashion',
  'urban',
  'classic',
  'summer',
  'leather',
  'brown',
  'white',
  'top',
  'coffee',
  'road',
  'jacket',
  'selfie',
])

function basenameFromFilename(filenameOrId = '') {
  return String(filenameOrId || '')
    .trim()
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
}

export function abbreviateIdentityTransferFilename(filenameOrId = '') {
  let tokens = basenameFromFilename(filenameOrId).split(/[-_]+/).filter(Boolean)

  if (!tokens.length) return ''

  const genderToken = tokens[0] === 'female' || tokens[0] === 'male' ? tokens.shift() : ''
  const gender = genderToken === 'male' ? 'M' : genderToken === 'female' ? 'F' : ''

  if (tokens[0] === 'black' && tokens[1] === 'white') {
    tokens = ['BW', ...tokens.slice(2)]
  }

  const kept = tokens.filter((token) => !SKIP_TOKENS.has(token)).slice(0, 2)
  const short = kept.map((token) => {
    if (token === 'BW') return 'BW'
    if (token === 'dj') return 'DJ'
    return token
  })

  return [gender, short.join(' ')].filter(Boolean).join(' · ')
}

export function getIdentityTransferSubjectGender(filenameOrId = '') {
  return basenameFromFilename(filenameOrId).startsWith('female') ? 'woman' : 'man'
}

export const IDENTITY_TRANSFER_PROTOTYPE_SOURCES =
  IDENTITY_TRANSFER_SOURCE_IDS.map((id) => ({
    id,
    label: abbreviateIdentityTransferFilename(id),
    src: `${IDENTITY_TRANSFER_IMAGE_DIR}/${id}.png`,
  }))

export const DEFAULT_IDENTITY_TRANSFER_PROTOTYPE_ID =
  IDENTITY_TRANSFER_PROTOTYPE_SOURCES[0]?.id || IDENTITY_TRANSFER_SOURCE_IDS[0]

export function getIdentityTransferPrototypeSource(id = '') {
  const normalizedId = basenameFromFilename(id)

  return (
    IDENTITY_TRANSFER_PROTOTYPE_SOURCES.find((item) => item.id === normalizedId) ||
    IDENTITY_TRANSFER_PROTOTYPE_SOURCES.find(
      (item) => item.id === DEFAULT_IDENTITY_TRANSFER_PROTOTYPE_ID,
    ) ||
    IDENTITY_TRANSFER_PROTOTYPE_SOURCES[0]
  )
}

export function formatIdentityTransferSourceLabel(filenameOrId = '') {
  const basename = basenameFromFilename(filenameOrId)

  if (!basename) return ''

  const preset = IDENTITY_TRANSFER_PROTOTYPE_SOURCES.find(
    (item) => item.id === basename,
  )

  if (preset) return preset.label

  return abbreviateIdentityTransferFilename(basename)
}
