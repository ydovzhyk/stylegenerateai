import { Clapperboard, ImagePlay } from 'lucide-react'

export const ANIMATE_MODES = [
  {
    id: 'instagram_photo',
    title: 'Instagram Photo',
    label: 'Bring your photo to life',
    description:
      'Upload an Instagram photo, optionally add music, tune Kling settings, and generate a short 720p video.',
    workspaceHint:
      'Upload your photo, write how it should move, optionally add music, then generate.',
    icon: ImagePlay,
    accent: 'from-fuchsia-400/20 to-primary/25',
    promptPlaceholder:
      'Example: Soft smile, gentle hair movement, slow camera push-in, keep the same person and outfit.',
  },
]

export const ANIMATE_KLING_MODELS = [
  {
    id: 'kling-4.0',
    label: 'Kling 4.0',
    description: 'Higher quality motion (slower).',
  },
  {
    id: 'kling-4.0-flash',
    label: 'Kling 4.0 Flash',
    description: 'Faster draft motion.',
  },
]

/** Metrics phase: only 720p is billed/logged for now. */
export const ANIMATE_RESOLUTIONS = [
  {
    id: '720p',
    label: '720p',
    description: 'Fixed for the first metrics phase.',
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
export const DEFAULT_ANIMATE_MODEL = 'kling-4.0'
export const DEFAULT_ANIMATE_RESOLUTION = '720p'

export const ANIMATE_PAGE_ICON = Clapperboard
