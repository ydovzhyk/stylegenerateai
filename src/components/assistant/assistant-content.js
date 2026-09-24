import { PHOTO_LAB_MODES } from '@/components/photo-lab/photo-lab-modes'

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
    '/pricing':
      'You are now on the Pricing page, where you can review plans and credits.',
  },
  intros: {
    '/': `${PRODUCT_NAME} is a fun photo studio in the browser. You upload your pictures, choose a direction, and get a polished AI result — without design skills.

Here is where to go:

- **Looks** — generate a photo of yourself from ready-made templates. Pick a look, upload your photo, and create.
- **Photo Lab** — edit a photo you already have: portraits, restore, retouch, identity transfer, object removal, and quality boost.
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
- **Creative Retouch** — cleaner skin and a finished look, not a full remake.

Tell me which mode you picked (or want), and I will walk you through it.`,
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

**AI model** — Classic lets you choose Photo likeness. Newest always keeps maximum likeness and bills it as **Closer to original**.

**Photo likeness** — Classic only. **Closer to original** keeps your face safer. **More enhancement** restyles more strongly.

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
  smart_edit: `**Your photo** — the main hero image to change. You can add up to 5 extra reference photos (outfit, place, object) — references are cues, not identity donors.

**Edit prompt** — required. Describe the scene and changes: clothes, background, lighting, or details.

**Output orientation** — Vertical, Square, or Horizontal.`,
  identity_transfer: `**Photos** — upload **Reference photo** first (pose, clothes, and scene to keep 1:1), then a clear **Face photo** of you.

Hairstyle comes from the reference by default. Write **Keep my hairstyle** in the prompt to keep yours.

**Optional refinements** — extra wishes. Optional.`,
  remove_objects: `**Your photo** — the shot to clean.

Paint a mask over what to remove, and/or describe it in **Additional prompt**. You need at least a mask or a short description.`,
  enhance_quality: `**Your photo** — a soft, noisy, compressed, or hazy shot. The scene stays the same.

**Optional refinements** — extra wishes for sharpness or haze. Optional.`,
  creative_retouch: `**Your photo** — a portrait, lifestyle, or social photo. Same scene, cleaner finish — not a full remake.

**Optional refinements** — extra wishes for skin or tone. Optional.`,
}

function getSharedPhotoLabSettingsText() {
  return `**Export size** — Draft, Standard, Premium, or Print.

**AI model** — Classic lets you choose Photo likeness. Newest always keeps maximum likeness and bills it as **Closer to original**.

**Photo likeness** — Classic only. **Closer to original** is safer for faces. **More enhancement** changes more.`
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
  const newestHint = isLogin
    ? '**Newest**, if you want maximum likeness and the face should stay closer to your photo'
    : '**Newest** after you sign in, if you want maximum likeness'
  const gallery = isLogin
    ? `**Save to gallery** — keeps the image in **My Gallery** (Looks or Photo Lab). Turn it on before **Download**: the image is saved first, then the file downloads.`
    : `**Save to gallery** — needs an account. Sign in to keep results in **My Gallery**. You can still download the file without signing in.`

  return `Your result is ready.

If you are not happy with it, change **one** thing and press **Regenerate** (this uses credits again):

- a clearer photo — face visible, decent light, not tiny, dark, or heavily filtered
- on Classic, **Closer to original**, if the face drifted
- ${newestHint}
- ${retryTarget}

When you like the result, use **Download options** next to the preview.

**Image title** — the name for the downloaded file and, if you save it, for My Gallery.

**Save file format** — PNG (best quality), JPG (smaller file), or WEBP (modern). PNG is always available. JPG and WEBP need a paid plan. If you chose Print, this picker is hidden while the print file is prepared.

${gallery}

**Download** — saves the file to your device. If you see a progress spinner after Print, wait until it finishes.`
}
