import { Clapperboard, ImagePlay, Images } from 'lucide-react'

export const ANIMATE_MODES = [
  {
    id: 'instagram_photo',
    title: 'Alive Photo',
    chipLabel: 'Alive photo',
    label: 'Make your photo come alive',
    description:
      'Upload a photo, optionally add music, tune motion, and turn that still moment into a short living clip.',
    workspaceHint:
      'Upload your photo, write how it should move, optionally add music, then generate.',
    icon: ImagePlay,
    accent: 'from-fuchsia-400/20 to-primary/25',
    promptPlaceholder:
      'Example: Soft smile, gentle hair movement, slow camera push-in, keep the same person and outfit.',
    promptRequired: false,
    maxReferences: 1,
    uploadKind: 'photo',
  },
  {
    id: 'prompt_refs',
    title: "Author's Vision",
    chipLabel: "Author's vision",
    label: 'Direct the scene yourself',
    description:
      'Describe the scene you have in mind, add 1–3 reference photos for look and identity, and generate a short video as you imagined it.',
    workspaceHint:
      'Write the prompt, upload 1–3 reference photos, pick aspect ratio, optionally add music, then generate. Mention Image 1 / Image 2 / Image 3 in the prompt when you want a specific photo used.',
    icon: Images,
    accent: 'from-cyan-400/20 to-primary/25',
    promptPlaceholder:
      'Example: Image 1 stands on the terrace from Image 2, picks up a glass, takes a sip, and looks at the view from Image 3. One continuous shot.',
    promptRequired: true,
    maxReferences: 3,
    uploadKind: 'references',
  },
]

/** Fallback catalogs when /animate/config is unavailable. */
export const ANIMATE_KLING_MODELS = [
  {
    id: 'kling-4.0-flash',
    label: 'Fast',
    description: 'Faster draft motion.',
    resolutions: ['720p'],
    durations: Array.from({ length: 28 }, (_, index) => index + 3),
  },
  {
    id: 'kling-4.0',
    label: 'Quality',
    description: 'Higher quality motion (slower).',
    resolutions: ['720p', '1080p'],
    durations: Array.from({ length: 28 }, (_, index) => index + 3),
  },
]

export const ANIMATE_MINIMAX_MODELS = [
  {
    id: 'minimax-h3-max',
    label: 'Fast',
    description: 'Faster draft motion.',
    resolutions: ['480P', '768P'],
    durations: Array.from({ length: 11 }, (_, index) => index + 5),
  },
  {
    id: 'minimax-h3',
    label: 'Quality',
    description: 'Higher quality motion (slower).',
    resolutions: ['768P', '2K'],
    durations: Array.from({ length: 12 }, (_, index) => index + 4),
  },
]

export const ANIMATE_RESOLUTIONS = [
  {
    id: '720p',
    label: '720p',
    description: 'Standard output.',
    models: ['kling-4.0-flash', 'kling-4.0'],
  },
  {
    id: '1080p',
    label: '1080p',
    description: 'Higher detail. Quality model only.',
    models: ['kling-4.0'],
  },
]

function fallbackModelsForProvider(provider) {
  return String(provider || '').toLowerCase() === 'minimax'
    ? ANIMATE_MINIMAX_MODELS
    : ANIMATE_KLING_MODELS
}

export function getAnimateResolutionsForModel(modelId, config = null) {
  const models = getAnimateModelsFromConfig(config)
  const model =
    models.find((item) => item.id === String(modelId || '').trim()) || models[0]
  const resolutions = Array.isArray(model?.resolutions) ? model.resolutions : []
  if (resolutions.length) {
    return resolutions.map((id) => ({ id, label: String(id) }))
  }

  const id = String(modelId || DEFAULT_ANIMATE_MODEL).trim()
  const list = ANIMATE_RESOLUTIONS.filter((item) =>
    (item.models || []).includes(id),
  )
  return list.length
    ? list
    : ANIMATE_RESOLUTIONS.filter((item) => item.id === '720p')
}

export function getAnimateModelsFromConfig(config = null) {
  if (config?.models?.length) return config.models
  return fallbackModelsForProvider(config?.provider)
}

export function getAnimateDurationsForModel(modelId, config = null) {
  const models = getAnimateModelsFromConfig(config)
  const model =
    models.find((item) => item.id === String(modelId || '').trim()) || models[0]
  const durations = Array.isArray(model?.durations) && model.durations.length
    ? model.durations
    : Array.from({ length: 28 }, (_, index) => index + 3)

  return durations.map((seconds) => ({
    id: String(seconds),
    value: String(seconds),
    label: `${seconds}s`,
  }))
}

export function getAnimateAspectRatiosFromConfig(config = null) {
  if (config?.aspectRatios?.length) {
    return config.aspectRatios.map((item) => ({
      id: item.id,
      label: item.label || item.id,
    }))
  }
  return ANIMATE_ASPECT_RATIOS
}

export const ANIMATE_ASPECT_RATIOS = [
  {
    id: '9:16',
    label: 'Portrait 9:16',
    description: 'Reels / Stories style.',
  },
  {
    id: '1:1',
    label: 'Square 1:1',
    description: 'Feed square.',
  },
  {
    id: '16:9',
    label: 'Landscape 16:9',
    description: 'Wide cinematic.',
  },
]

export const ANIMATE_DURATIONS = Array.from({ length: 28 }, (_, index) => {
  const seconds = index + 3
  return {
    id: String(seconds),
    value: seconds,
    label: `${seconds}s`,
  }
})

export const DEFAULT_ANIMATE_DURATION = 5
export const DEFAULT_ANIMATE_MODEL = 'kling-4.0-flash'
export const DEFAULT_ANIMATE_RESOLUTION = '720p'
export const DEFAULT_ANIMATE_ASPECT_RATIO = '9:16'
export const DEFAULT_ANIMATE_PROVIDER = 'kling'
export const MAX_PROMPT_REFS = 3

export const ANIMATE_PAGE_ICON = Clapperboard

export function getAnimateDefaultsFromConfig(config = null) {
  const provider = config?.provider || DEFAULT_ANIMATE_PROVIDER
  const isMiniMax = String(provider).toLowerCase() === 'minimax'
  const models = getAnimateModelsFromConfig(config)
  const fallbackModel = models[0]

  return {
    provider,
    model:
      config?.defaults?.model ||
      fallbackModel?.id ||
      (isMiniMax ? 'minimax-h3-max' : DEFAULT_ANIMATE_MODEL),
    resolution:
      config?.defaults?.resolution ||
      fallbackModel?.resolutions?.[0] ||
      (isMiniMax ? '768P' : DEFAULT_ANIMATE_RESOLUTION),
    duration: String(
      config?.defaults?.duration ||
        fallbackModel?.durations?.[0] ||
        DEFAULT_ANIMATE_DURATION,
    ),
    aspectRatio: config?.defaults?.aspectRatio || DEFAULT_ANIMATE_ASPECT_RATIO,
    maxPromptRefs: config?.maxPromptRefs || MAX_PROMPT_REFS,
  }
}
