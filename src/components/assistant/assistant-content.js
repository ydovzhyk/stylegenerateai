import { PHOTO_LAB_MODES } from '@/components/photo-lab/photo-lab-modes'
import { IMAGINE_MODES } from '@/constants/imagine'

export const PRODUCT_NAME = 'AI Style Generator'

export const ASSISTANT_CONTENT = {
  welcomeBubble:
    'Hi, I am here. Ask me and I will tell you more about what you can do.',
  generationBubble:
    'Your photo is ready. I can explain how to download it or save it to the gallery.',
  modeBubble: 'Ask me and I will tell you more about this mode.',
  pageBubbles: {
    '/': `Want a quick tour of ${PRODUCT_NAME}?`,
    '/photo-lab': 'Ask me and I will tell you more about Photo Lab.',
    '/imagine': 'Ask me and I will tell you more about Imagine.',
    '/create-your-look':
      'You are on the page for generating your own photos from suggested templates. I can tell you more in detail.',
    '/pricing': 'I can explain plans, credits, and what each option is for.',
  },
  greetings: {
    named: 'Hi, {name}! We are glad to welcome you to our site!',
    guest: 'Hi, guest! We are glad to welcome you to our site!',
  },
  pageLeads: {
    '/': 'You are now on the home page, where you can see an overview of what you can do on the site.',
    '/create-your-look':
      'You are now on the Looks page, where you generate your own photos from suggested templates.',
    '/photo-lab':
      'You are now on the Photo Lab page, where you edit a photo you already have.',
    '/imagine':
      'You are now on the Imagine page, where you generate a new idea from a description.',
    '/pricing':
      'You are now on the Pricing page, where you can review plans and credits.',
  },
  intros: {
    '/': `${PRODUCT_NAME} is a fun photo studio in the browser. You upload your pictures, choose a direction, and get a polished AI result — without design skills.

Here is where to go:

- **Looks** — generate a photo of yourself from ready-made templates. Pick a look, upload your photo, and create.
- **Photo Lab** — edit a photo you already have: portraits, restore, retouch, identity transfer, object removal, and quality boost.
- **Imagine** — generate a new idea: a wallpaper, a tattoo sketch, a home design, or a painting.
- **Pricing** — plans and credits if you want more generations.

You do not generate images in this chat — I only guide you. Open Looks for a new styled photo, or Photo Lab to transform an existing shot.

If you want details on any page, just ask.`,
    '/create-your-look': `How it works:

1. Browse or search the looks and pick one you like.
2. Upload a clear photo of yourself — face visible, decent light.
3. Generate. The result keeps you in the style of that template.

A sharp, well-lit portrait usually beats a tiny, dark, or heavily filtered shot. You can switch templates and try again anytime.

Need help choosing a look or getting a better result? Ask here.`,
    '/photo-lab': `Each mode is a different job — pick one first, then upload.

Typical choices:

- **Professional Portrait** — a casual photo into a LinkedIn / CV headshot.
- **Restore & Colorize** — repair old, faded, or damaged pictures.
- **Smart Edit** — change clothes, background, lighting, or details with a prompt.
- **Identity Transfer** — keep a reference shot 1:1 and put your face into it.
- **Remove Objects** — clean people or clutter out of the frame.
- **Enhance Quality** — sharper and clearer, same scene.
- **Creative Retouch** — even skin, cleared blemishes, and groomed hair on the same photo, not a full remake.
- **Photo Styles** — turn one photo into a coloring page, cartoon, sticker, clipart, drawing, painting, or a professional studio shot.

Tell me which mode you picked (or want), and I will walk you through it.`,
    '/imagine': `Imagine starts from a description.

- **Wallpaper** — fills the frame edge to edge. Width and height start at 0.
  **With a reference photo:** upload the photo, leave both sizes at 0, and write only what to change. Example: replace the BMW with the latest Audi A5 and keep the dark color. The wallpaper keeps that photo's size, scene, camera, and lighting. Computer, Phone, or a typed size still sets the pixels, but the scene stays the uploaded photo. On the preview, the reference photo is on the left, the prompt sits in a frame on that photo, and the result is on the right.
  **Without a photo:** leave both sizes at 0. A device named in the prompt, such as a Dell XPS 16, uses its standard screen. With no device, the wallpaper is 1920×1080. Computer sets 1920×1080, Phone sets 1280×2856, or type both sizes. A short or empty idea becomes a full photographic scene. A detailed prompt is kept.
- **Tattoo** — a clean sketch for a tattoo artist, on a plain background, not a tattoo on skin. The prompt is required. Width and height are in centimeters and start at 5 and 10. With a reference photo, choose Custom and write: "Make this same subject a clean sketch." Fine line, Stencil, Blackwork, and Symbolic restyle the idea into that technique.
- **Home** — upload your place. A design example is optional: another house or room that shows the look you want. The result is one photo of your place in that look. Leave both the example and the prompt empty and a style is chosen for you.
- **Painting** — your own scene or a known painting, in a chosen technique. A photo can be the subject.

A reference photo is optional on Wallpaper, Tattoo, and Painting.`,
    '/pricing': `Generations use credits, and the options you choose — quality, model, and similar — affect how much a run costs.

If you tell me whether you mostly use Looks, Photo Lab, or both, I can help you pick a sensible starting point.

Ask if any option on this page is unclear.`,
  },
  title: 'AI assistant',
  hintsLabel: 'Hints',
  hintsOn: 'On',
  hintsOff: 'Off',
  placeholder: 'Ask something…',
  send: 'Send',
  close: 'Close assistant',
  open: 'Open assistant',
  menu: 'Menu',
  clearChat: 'Clear chat',
  thinking: 'Thinking…',
  lookTemplateBubble:
    'I see you picked a template. I can now tell you which settings to use, and what kind of photo to upload.',
  photoLabModeBubble:
    'I see you picked {mode}. I can now tell you which settings to use, and what photo to upload.',
}

export const ASSISTANT_HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/photo-lab-preview',
  '/imagine-preview',
  '/ready-template',
]

export function normalizeAssistantPath(pathname) {
  const path = String(pathname || '/')
    .split('?')[0]
    .split('#')[0]
  const trimmed = path.replace(/\/+$/, '')
  return trimmed || '/'
}

export function getPageBubbleText(pathname) {
  return ASSISTANT_CONTENT.pageBubbles[normalizeAssistantPath(pathname)] || null
}

export function getGreetingText(displayName) {
  const name = String(displayName || '')
    .trim()
    .split(/\s+/)[0]

  if (name) {
    return ASSISTANT_CONTENT.greetings.named.replace('{name}', name)
  }

  return ASSISTANT_CONTENT.greetings.guest
}

export function getPageLeadText(pathname) {
  const path = normalizeAssistantPath(pathname)
  return ASSISTANT_CONTENT.pageLeads[path] || ASSISTANT_CONTENT.pageLeads['/']
}

export function getIntroText(pathname) {
  const path = normalizeAssistantPath(pathname)
  return ASSISTANT_CONTENT.intros[path] || ASSISTANT_CONTENT.intros['/']
}

export function getDirectIntroText(pathname) {
  const lead = getPageLeadText(pathname)
  const intro = getIntroText(pathname)
  if (!lead) return intro
  if (!intro) return lead
  return `${lead}\n\n${intro}`
}

export function detectChatLanguage(text, fallback = 'en') {
  const sample = String(text || '').trim()
  if (!sample) return fallback

  const hasCyrillic = /[\u0400-\u04FF]/.test(sample)
  if (hasCyrillic) {
    const hasUkrainian = /[іІїЇєЄґҐ]/.test(sample)
    const hasRussianOnly = /[ыЫэЭёЁъЪ]/.test(sample)
    if (hasUkrainian) return 'uk'
    if (hasRussianOnly && !hasUkrainian) return 'ru'
    return 'uk'
  }

  if (/[\u0590-\u05FF]/.test(sample)) return 'he'
  if (/[\u0600-\u06FF]/.test(sample)) return 'ar'
  if (/[\u3040-\u30FF]/.test(sample)) return 'ja'
  if (/[\uAC00-\uD7AF]/.test(sample)) return 'ko'
  if (/[\u4E00-\u9FFF]/.test(sample)) return 'zh'
  if (/[a-zA-Z]{3,}/.test(sample)) return 'en'

  return fallback
}

export function hasPageIntro(pathname) {
  const path = normalizeAssistantPath(pathname)
  return Boolean(ASSISTANT_CONTENT.pageLeads[path])
}

export function isAssistantHiddenPath(pathname) {
  const path = normalizeAssistantPath(pathname)
  return ASSISTANT_HIDDEN_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

function getPhotoLabMode(modeId) {
  return PHOTO_LAB_MODES.find((mode) => mode.id === modeId) || null
}

export function getLookTemplateBubbleText(templateTitle) {
  const title = String(templateTitle || '').trim()
  if (title) {
    return `I see you picked "${title}". I can now tell you which settings to use, and what kind of photo to upload.`
  }
  return ASSISTANT_CONTENT.lookTemplateBubble
}

export function getLookSettingsText(templateTitle, pricingCopy = '') {
  const title = String(templateTitle || '').trim()
  const lead = title
    ? `You picked **${title}**. Next, upload your photo and review the settings under the extra prompt.`
    : 'You picked a look. Next, upload your photo and review the settings under the extra prompt.'
  const pricing = String(pricingCopy || '').trim()

  return `${lead}

**Your photo** — a clear portrait of yourself: face visible, decent light. Avoid tiny, dark, or heavily filtered shots.

**Additional prompt** — optional extra wishes (outfit, mood, background). Leave it empty if the template is enough. This does not change the credit price.

**Output format** — the frame: Portrait 2:3, Square 1:1, or Landscape 3:2.

**Export size** — Draft, Standard, Premium, or Print.

${pricing}`
}

export function getPhotoLabModeBubbleText(modeId) {
  const title = getPhotoLabMode(modeId)?.title || 'this mode'
  return ASSISTANT_CONTENT.photoLabModeBubble.replace('{mode}', title)
}

const PHOTO_LAB_MODE_GUIDES = {
  professional_portrait: `**Your photo** — a clear face or upper-body shot, decent light.

**Optional refinements** — extra wishes such as smile, blazer, or background. Optional.`,
  restore_colorize: `**Your photo** — an old, blurry, damaged, faded, or black-and-white picture.

**Restore type** — **Restore only** repairs the photo and keeps the original tones. **Restore & colorize** also adds natural color.

**Optional refinements** — extra wishes for tone or repair. Optional.`,
  smart_edit: `**Main photo** — the photo to edit. Use the buttons above it.

**Detail 1–5** — optional photos of clothes, objects, or a place. Add them in order, then describe the change in the edit prompt.`,
  identity_transfer: `**Photos** — upload **Reference photo** first (pose, clothes, and scene to keep 1:1), then a clear **Face photo** of you.

Hairstyle comes from the reference by default. Write **Keep my hairstyle** in the prompt to keep yours.

**Optional refinements** — extra wishes. Optional.`,
  remove_objects: `**Your photo** — the shot to clean.

Paint a mask over what to remove, and/or describe it in **Additional prompt**. You need at least a mask or a short description.`,
  enhance_quality: `**Your photo** — a soft, noisy, compressed, or hazy shot. The scene stays the same.

**Optional refinements** — extra wishes for sharpness or haze. Optional.`,
  creative_retouch: `**Your photo** — a portrait, lifestyle, or social photo. Same scene. The finish evens skin on the face and hands, clears blemishes, and grooms the existing hair. It is not a new face, pose, or hairstyle.

**Optional refinements** — extra wishes for skin or tone. Optional.`,
  photo_styles: `**Style** — pick one with the buttons above the photo: coloring page, cartoon, sticker, clipart, drawing, painting, or a professional studio shot.

**Your photo** — one photo of the person, animal, or object to restyle.

**Optional refinements** — extra wishes. Optional.`,
}

function getSharedPhotoLabSettingsText() {
  return `**Export size** — Draft, Standard, Premium, or Print.`
}

export function getPhotoLabModeSettingsText(modeId, pricingCopy = '') {
  const mode = getPhotoLabMode(modeId)
  const title = mode?.title || 'this Photo Lab mode'
  const guide =
    PHOTO_LAB_MODE_GUIDES[modeId] ||
    '**Your photo** — follow the upload hint for this mode, then review the settings below.'
  const pricing = String(pricingCopy || '').trim()

  return `You picked **${title}**.

${guide}

${getSharedPhotoLabSettingsText()}

${pricing}`
}

function getImagineMode(modeId) {
  return IMAGINE_MODES.find((mode) => mode.id === modeId) || null
}

export function getImagineModeBubbleText(modeId) {
  const title = getImagineMode(modeId)?.title || 'this mode'
  return ASSISTANT_CONTENT.photoLabModeBubble.replace('{mode}', title)
}

const IMAGINE_MODE_GUIDES = {
  wallpaper: `**With a reference photo** — upload the photo, leave width and height at 0, and write only what to change. Example: replace the BMW with the latest Audi A5 and keep the dark color. The wallpaper keeps that photo's size, scene, camera, and lighting. Computer, Phone, or a typed size still sets the pixels, but the scene stays the uploaded photo. An empty prompt keeps the photograph as it is.

**Without a photo** — leave both sizes at 0. A device named in the prompt, such as a Dell XPS 16, uses its standard screen. With no device, the wallpaper is 1920×1080. Computer sets 1920×1080. Phone sets 1280×2856. Or type both sizes.

**Prompt** — optional. A short or empty idea becomes a full photographic scene. A detailed prompt is kept.`,
  tattoo: `**Result** — a clean sketch on a plain background for a tattoo artist. It is not a photo of a tattoo on skin.

**Prompt** — required, even when a reference photo is uploaded. The photo is only the idea. The prompt says what to keep.

**Size** — width and height in centimeters, from 1 to 40. The fields start at 5 and 10.

**Style** — Custom, Fine line, Stencil, Blackwork, or Symbolic.
With a reference photo, choose **Custom** when the style is already in the photo. The other styles push their own look and can leave the reference.
Choose Fine line, Stencil, Blackwork, or Symbolic only when the photo is the subject and the sketch should be in that technique.

**Prompt examples**
- Custom: A Japanese koi fish swimming upstream through swirling waves, surrounded by cherry blossoms, in a traditional Japanese tattoo style.
- Custom with a reference photo: Make this same subject a clean sketch.
- Fine line: A delicate butterfly surrounded by tiny wildflowers, with elegant flowing details and a graceful composition.
- Stencil: A highly realistic tiger head facing forward, with an intense gaze, detailed fur texture, natural facial anatomy, and a powerful expression.
- Blackwork: A mysterious raven perched on an ancient skull, surrounded by thorny branches and dark botanical elements.
- Symbolic: A broken hourglass with sand transforming into flying birds, surrounded by subtle geometric shapes, symbolizing freedom, the passage of time and destiny.

**Reference photo** — optional. Upload it in the center card.`,
  home: `**Your place** — required. Upload a house, yard, or room. The result is one photo of that same place.

**Design example** — optional. Upload a photo of the look you want, even from another house or room. That look is applied to your place.

**Prompt** — optional. Use it for an extra wish, or leave it empty. With no example and no prompt, a style is chosen for you.`,
  painting: `**Technique** — As described, Cubism, Impressionism, Oil, Watercolor, or Expressionism.

**Prompt or photo** — write your own scene, name a known painting, or upload a photo to paint from. You need a prompt or a photo.

There is no size panel. Without a photo, the painting is square.`,
}

export function getImagineModeSettingsText(modeId, pricingCopy = '') {
  const mode = getImagineMode(modeId)
  const title = mode?.title || 'this Imagine mode'
  const guide =
    IMAGINE_MODE_GUIDES[modeId] ||
    'Follow the fields for this mode, then press Generate.'
  const pricing = String(pricingCopy || '').trim()

  return `You picked **${title}**.

${guide}

${pricing}`
}

export function getGenerationSaveBubbleText() {
  return ASSISTANT_CONTENT.generationBubble
}

export function getGenerationSaveSettingsText({
  isLogin = false,
  pathname = '',
} = {}) {
  const isPhotoLab = String(pathname || '') === '/photo-lab'
  const retryTarget = isPhotoLab
    ? 'a short extra prompt, or another Photo Lab mode'
    : 'a short extra prompt, or another look'
  const gallery = isLogin
    ? `**Save to gallery** — keeps the image in **My Gallery** (Looks or Photo Lab). Turn it on before **Download**: the image is saved first, then the file downloads.`
    : `**Save to gallery** — needs an account. Sign in to keep results in **My Gallery**. You can still download the file without signing in.`

  return `Your result is ready.

If you are not happy with it, change **one** thing and press **Regenerate** (this uses credits again):

- a clearer photo — face visible, decent light, not tiny, dark, or heavily filtered
- ${retryTarget}

When you like the result, use **Download options** next to the preview.

**Image title** — the name for the downloaded file and, if you save it, for My Gallery.

**Save file format** — PNG (best quality), JPG (smaller file), or WEBP (modern). PNG is always available. JPG and WEBP need a paid plan. If you chose Print, this picker is hidden while the print file is prepared.

${gallery}

**Download** — saves the file to your device. If you see a progress spinner after Print, wait until it finishes.`
}
