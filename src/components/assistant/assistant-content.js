export const ASSISTANT_CONTENT = {
  welcomeBubble:
    'Hi, I am here. Ask me and I will tell you more about what you can do.',
  generationBubble: 'I can give you recommendations for this generation.',
  modeBubble: 'Ask me and I will tell you more about this mode.',
  pageBubbles: {
    '/': 'Want a quick tour of Style Generate AI?',
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
    '/': `Style Generate AI is a fun photo studio in the browser. You upload your pictures, choose a direction, and get a polished AI result — without design skills.

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
  const path = String(pathname || '/').split('?')[0].split('#')[0]
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
