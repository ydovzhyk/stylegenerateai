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
      'Example: make it look like a clean LinkedIn studio portrait with a modern office background.',
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
      'Example: restore details, colorize naturally, clean scratches, and keep the original person recognizable.',
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
      'Example: change the outfit to a black suit and place the person in a modern office.',
    uploadHint:
      'Upload 1 image for simple edits. Multiple images can come later.',
  },
  {
    id: 'remove_objects',
    title: 'Remove Objects',
    label: 'Clean distractions',
    description:
      'Remove unwanted objects, people, background distractions, or visual noise from your photo.',
    icon: Eraser,
    accent: 'from-rose-400/20 to-primary/25',
    promptPlaceholder:
      'Example: remove the person in the background and clean the table.',
    uploadHint: 'Upload a photo with the object you want removed.',
  },
  {
    id: 'enhance_quality',
    title: 'Enhance Quality',
    label: 'Sharpen / upscale',
    description:
      'Improve low-quality, compressed, blurry, or dark photos with AI enhancement.',
    icon: ImagePlus,
    accent: 'from-emerald-300/20 to-cyan-400/20',
    promptPlaceholder:
      'Example: improve sharpness, lighting, details, and overall photo quality.',
    uploadHint: 'Upload a low-quality or blurry image.',
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
      'Example: make the photo look cinematic, premium, clean, and natural.',
    uploadHint: 'Upload a portrait, lifestyle, or social media photo.',
  },
]
