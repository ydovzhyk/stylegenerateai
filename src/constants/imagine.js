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
  {
    id: 'custom',
    label: 'Custom',
    promptExample:
      'Example: A Japanese koi fish swimming upstream through swirling waves, surrounded by cherry blossoms, in a traditional Japanese tattoo style.',
  },
  {
    id: 'fine_line',
    label: 'Fine line',
    promptExample:
      'Example: A delicate butterfly surrounded by tiny wildflowers, with elegant flowing details and a graceful composition.',
  },
  {
    id: 'stencil',
    label: 'Stencil',
    promptExample:
      'Example: A highly realistic tiger head facing forward, with an intense gaze, detailed fur texture, natural facial anatomy, and a powerful expression.',
  },
  {
    id: 'blackwork',
    label: 'Blackwork',
    promptExample:
      'Example: A mysterious raven perched on an ancient skull, surrounded by thorny branches and dark botanical elements.',
  },
  {
    id: 'symbolic',
    label: 'Symbolic',
    promptExample:
      'Example: A broken hourglass with sand transforming into flying birds, surrounded by subtle geometric shapes, symbolizing freedom, the passage of time and destiny.',
  },
]

export const TATTOO_REFERENCE_PROMPT_EXAMPLE =
  'Example: Make this same subject a clean sketch.'

export const PAINTING_TECHNIQUES = [
  { id: 'described', label: 'As described' },
  { id: 'cubism', label: 'Cubism' },
  { id: 'impressionism', label: 'Impressionism' },
  { id: 'oil', label: 'Oil' },
  { id: 'watercolor', label: 'Watercolor' },
  { id: 'expressionism', label: 'Expressionism' },
]
