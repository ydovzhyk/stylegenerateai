import { House, ImageIcon, Palette, PenLine } from 'lucide-react'

export const IMAGINE_MODES = [
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    label: 'Phone or computer',
    description:
      'Pick Computer or Phone, or type a size. Leave the prompt empty for a surprise scene. The image fills the frame.',
    icon: ImageIcon,
    accent: 'from-sky-300/25 to-primary/25',
    promptPlaceholder:
      'Example: New York at dusk. Leave empty for a surprise scene.',
  },
  {
    id: 'tattoo',
    title: 'Tattoo',
    label: 'Sketch for your artist',
    description:
      'Describe a tattoo sketch and set the print size in centimeters. The result is a clean design to hand to a tattoo artist.',
    icon: PenLine,
    accent: 'from-rose-400/20 to-primary/25',
    promptPlaceholder: 'Example: a small wolf under a thin crescent moon.',
  },
  {
    id: 'home',
    title: 'Home',
    label: 'House, yard, or room',
    description:
      'Upload your place. Add a design example when you already know the look. Leave the prompt empty for a surprise style.',
    icon: House,
    accent: 'from-amber-300/20 to-primary/25',
    promptPlaceholder:
      'Example: dark wood cladding and a simple planted yard.',
  },
  {
    id: 'painting',
    title: 'Painting',
    label: 'A technique, a subject',
    description:
      'Ask for your own scene or a known painting. Add a photo to paint that subject in the chosen technique.',
    icon: Palette,
    accent: 'from-violet-400/20 to-primary/25',
    promptPlaceholder:
      'Example: a storm over the sea, or name a known painting.',
  },
]

export const WALLPAPER_PRESETS = [
  { id: 'computer', label: 'Computer', width: 1920, height: 1080 },
  { id: 'phone', label: 'Phone', width: 1280, height: 2856 },
]

export const TATTOO_STYLES = [
  { id: 'custom', label: 'Custom' },
  { id: 'fine_line', label: 'Fine line' },
  { id: 'stencil', label: 'Stencil' },
  { id: 'blackwork', label: 'Blackwork' },
  { id: 'symbolic', label: 'Symbolic' },
]

export const PAINTING_TECHNIQUES = [
  { id: 'described', label: 'As described' },
  { id: 'cubism', label: 'Cubism' },
  { id: 'impressionism', label: 'Impressionism' },
  { id: 'oil', label: 'Oil' },
  { id: 'watercolor', label: 'Watercolor' },
  { id: 'expressionism', label: 'Expressionism' },
]
