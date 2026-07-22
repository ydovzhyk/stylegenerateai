import {
  BriefcaseBusiness,
  Eraser,
  ImagePlus,
  Paintbrush,
  Sparkles,
  WandSparkles,
} from 'lucide-react'

export const PHOTO_LAB_MODES = [
  {
    id: 'professional_portrait',
    title: 'Professional Portrait',
    label: 'LinkedIn / CV photo',
    description:
      'Turn a casual photo into a LinkedIn-ready headshot — same person, professional outfit, and a modern office look.',
    icon: BriefcaseBusiness,
    accent: 'from-primary/30 to-cyan-400/20',
    promptPlaceholder:
      'Example: soft smile, light blazer, natural office background.',
    uploadHint: 'Upload a clear face or upper-body photo.',
  },
  {
    id: 'restore_colorize',
    title: 'Restore & Colorize',
    label: 'Old photo repair',
    description:
      'Bring old photos back — repair damage and fading, and optionally add natural color. Same photo, clearer memory.',
    icon: Sparkles,
    accent: 'from-amber-300/20 to-primary/25',
    promptPlaceholder:
      'Example: softer faded edges, cleaner scratches, warmer natural tones.',
    uploadHint: 'Upload an old, blurry, damaged, or black-and-white photo.',
  },
  {
    id: 'smart_edit',
    title: 'Smart Edit',
    label: 'Prompt-based edits',
    description:
      'Change clothes, backgrounds, lighting, objects, mood, or scene details using simple instructions.',
    icon: WandSparkles,
    accent: 'from-cyan-400/20 to-primary/25',
    promptPlaceholder:
      'Example: camera on a tripod in front of me on the table; I am wearing the hoodie from reference photo 1.',
    uploadHint:
      'Upload your main photo, optionally add up to 5 reference photos, then describe the edit.',
  },
  {
    id: 'remove_objects',
    title: 'Remove Objects',
    label: 'Clean distractions',
    description:
      'Remove unwanted people, objects, or clutter — same photo, everything else stays as it was.',
    icon: Eraser,
    accent: 'from-rose-400/20 to-primary/25',
    promptPlaceholder:
      'Example: remove the seagulls near the man\'s feet...',
    uploadHint:
      'Upload a photo, then paint what to remove and/or describe it.',
  },
  {
    id: 'enhance_quality',
    title: 'Enhance Quality',
    label: 'Sharper & clearer',
    description:
      'Make soft, noisy, or hazy photos sharper and clearer — same shot, same person, same scene.',
    icon: ImagePlus,
    accent: 'from-emerald-300/20 to-cyan-400/20',
    promptPlaceholder:
      'Example: clearer background details, less noise in shadows.',
    uploadHint: 'Upload a soft, noisy, compressed, or hazy photo.',
  },
  {
    id: 'creative_retouch',
    title: 'Creative Retouch',
    label: 'Instagram polish',
    description:
      'Keep the same photo — cleaner skin, even tone, and a premium Instagram-ready finish.',
    icon: Paintbrush,
    accent: 'from-fuchsia-400/20 to-primary/25',
    promptPlaceholder:
      'Example: softer skin on arms, cleaner shirt, warmer evening tones.',
    uploadHint: 'Upload a portrait, lifestyle, or social media photo.',
  },
]
