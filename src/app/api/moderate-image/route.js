import { reportClientError } from '@/utils/error-log/report-client-error'

const MODERATION_MODEL = 'omni-moderation-latest'
const MAX_IMAGE_BYTES = 20 * 1024 * 1024

export async function POST(req) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    reportClientError({
      source: 'next-api',
      method: 'POST',
      path: '/api/moderate-image',
      status: 500,
      code: 'MODERATION_UNAVAILABLE',
      message: 'OpenAI API key is missing',
    })
    return Response.json({ error: 'MODERATION_UNAVAILABLE' }, { status: 500 })
  }

  let form
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'IMAGE_REQUIRED' }, { status: 400 })
  }

  const file = form.get('image')

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'IMAGE_REQUIRED' }, { status: 400 })
  }

  if (!String(file.type || '').startsWith('image/')) {
    return Response.json({ error: 'IMAGE_REQUIRED' }, { status: 400 })
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: 'IMAGE_TOO_LARGE' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const dataUrl = `data:${file.type};base64,${bytes.toString('base64')}`

  let response
  try {
    response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODERATION_MODEL,
        input: [
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      }),
    })
  } catch {
    reportClientError({
      source: 'next-api',
      method: 'POST',
      path: '/api/moderate-image',
      status: 502,
      code: 'MODERATION_FAILED',
      message: 'Moderation request failed',
    })
    return Response.json({ error: 'MODERATION_FAILED' }, { status: 502 })
  }

  if (response.status === 429) {
    console.warn('[moderate-image] rate limited, treating photo as clear')
    reportClientError({
      source: 'next-api',
      method: 'POST',
      path: '/api/moderate-image',
      status: 429,
      code: 'RATE_LIMIT',
      message: 'OpenAI moderation rate limit',
    })
    return Response.json({ flagged: false })
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    reportClientError({
      source: 'next-api',
      method: 'POST',
      path: '/api/moderate-image',
      status: response.status,
      code: 'MODERATION_FAILED',
      message: data?.error?.message || 'Moderation request failed',
    })
    return Response.json({ error: 'MODERATION_FAILED' }, { status: 502 })
  }

  return Response.json({
    flagged: Boolean(data?.results?.[0]?.flagged),
  })
}
