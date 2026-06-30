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
      'Create a polished business portrait for LinkedIn, resumes, profiles, and professional platforms.',
    icon: BriefcaseBusiness,
    accent: 'from-primary/30 to-cyan-400/20',
    promptPlaceholder:
      'Example: straight hair, light sun tan, soft smile.',
    uploadHint: 'Upload a clear face or upper-body photo.',
  },
  {
    id: 'restore_colorize',
    title: 'Restore & Colorize',
    label: 'Old photo repair',
    description:
      'Restore damaged, blurry, or black-and-white photos and bring old memories back to life.',
    icon: Sparkles,
    accent: 'from-amber-300/20 to-primary/25',
    promptPlaceholder:
      'Example: warmer skin tones, cleaner scratches, softer faded edges.',
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
      'Example: navy blazer instead of gray, warmer office lighting.',
    uploadHint:
      'Upload 1 image for simple edits. Multiple images can come later.',
  },
  {
    id: 'remove_objects',
    title: 'Remove Objects',
    label: 'Clean distractions',
    description:
      'Remove unwanted objects or distractions. Paint a mask, describe what to remove, or both.',
    icon: Eraser,
    accent: 'from-rose-400/20 to-primary/25',
    promptPlaceholder:
      'Optional with a mask. Or prompt-only: remove the seagulls near the man\'s feet...',
    uploadHint:
      'Upload a photo, then paint a mask and/or describe what to remove.',
  },
  {
    id: 'enhance_quality',
    title: 'Enhance Quality',
    label: 'Clarity cleanup',
    description:
      'Clean noise, compression, blur, and dark or hazy photos while keeping the same shot, pose, and scene.',
    icon: ImagePlus,
    accent: 'from-emerald-300/20 to-cyan-400/20',
    promptPlaceholder:
      'Example: slightly brighter face, reduce noise in shadows.',
    uploadHint: 'Upload a dark, blurry, noisy, or compressed photo.',
  },
  {
    id: 'creative_retouch',
    title: 'Creative Retouch',
    label: 'Style polish',
    description:
      'Add cinematic lighting, premium color grading, clean skin tones, and a more polished look.',
    icon: Paintbrush,
    accent: 'from-fuchsia-400/20 to-primary/25',
    promptPlaceholder:
      'Example: warmer cinematic tones, softer skin, light film grain.',
    uploadHint: 'Upload a portrait, lifestyle, or social media photo.',
  },
]
