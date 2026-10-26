import { House, ImageIcon, Palette, PenLine } from 'lucide-react'

export const IMAGINE_MODES = [
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    label: 'Phone or computer',
    description:
      'Create a wallpaper for your phone or computer - from a short idea or a photo.',
    workspaceHint:
      'Pick a screen size, add a prompt or leave it empty for a surprise, optional photo.',
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
      'Get a clean sketch to hand to your tattoo artist, with size in centimeters.',
    workspaceHint:
      'Choose a style and size in cm, describe the idea, optional reference photo.',
    icon: PenLine,
    accent: 'from-rose-400/20 to-primary/25',
    promptPlaceholder: 'Example: a small wolf under a thin crescent moon.',
  },
  {
    id: 'home',
    title: 'Home',
    label: 'House, yard, or room',
    description:
      'Create a new look for your house or room from a photo of the place.',
    workspaceHint:
      'Upload a photo of your place. A design example and prompt are optional.',
    icon: House,
    accent: 'from-amber-300/20 to-primary/25',
    promptPlaceholder:
      'Example: dark wood cladding and a simple planted yard.',
  },
  {
    id: 'painting',
    title: 'Painting',
    label: 'Any scene, any artist look',
    description:
      'Paint your own scene, a famous work, or a photo - in oil, pencil, gouache, and more.',
    workspaceHint:
      'Choose a look and canvas size, then add a prompt and/or photo.',
    icon: Palette,
    accent: 'from-violet-400/20 to-primary/25',
    promptPlaceholder:
      'Example: a storm over the sea, or Starry Night, or in the style of Monet.',
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
  { id: 'original', label: 'As original' },
  { id: 'photo', label: 'As photo' },
  { id: 'oil', label: 'Oil' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'gouache', label: 'Gouache' },
]

export const PAINTING_CANVAS_PRESETS = [
  { id: 'auto', label: 'Auto', width: 0, height: 0 },
  { id: 'square', label: 'Square', width: 1024, height: 1024 },
  { id: 'landscape', label: 'Landscape', width: 1536, height: 1024 },
  { id: 'portrait', label: 'Portrait', width: 1024, height: 1536 },
]
