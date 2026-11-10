import { Clapperboard, ImagePlay, Images } from 'lucide-react'

export const ANIMATE_MODES = [
  {
    id: 'instagram_photo',
    title: 'Instagram Photo',
    label: 'Bring your photo to life',
    description:
      'Upload an Instagram photo, optionally add music, tune motion settings, and generate a short 720p video.',
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
    title: 'Prompt + Refs',
    label: 'Build a clip from a prompt',
    description:
      'Describe the scene, add 1–3 reference photos for look and identity, optionally add music, and generate a short 720p video.',
    workspaceHint:
      'Write the prompt, upload 1–3 reference photos, pick aspect ratio, optionally add music, then generate. Mention @ref_1 / @ref_2 / @ref_3 in the prompt when you want a specific photo used.',
    icon: Images,
    accent: 'from-cyan-400/20 to-primary/25',
    promptPlaceholder:
      'Example: @ref_1 walks through a quiet street at dusk, soft wind in the hair, slow tracking shot, keep the face and outfit from @ref_1.',
    promptRequired: true,
    maxReferences: 3,
    uploadKind: 'references',
  },
]

export const ANIMATE_KLING_MODELS = [
  {
    id: 'kling-4.0-flash',
    label: 'Fast',
    description: 'Faster draft motion.',
  },
  {
    id: 'kling-4.0',
    label: 'Quality',
    description: 'Higher quality motion (slower).',
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
export const MAX_PROMPT_REFS = 3

export const ANIMATE_PAGE_ICON = Clapperboard
