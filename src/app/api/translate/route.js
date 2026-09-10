import translate from 'translate'

translate.key = process.env.TRANSLATE_API_KEY

async function translateWithGoogleCloud(text, to, from) {
  const key = process.env.TRANSLATE_API_KEY
  if (!key) return null

  const body = {
    q: text,
    target: to,
    format: 'text',
  }
  if (from) body.source = from

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      data?.error?.message || `Google Cloud Translate ${res.status}`
    throw new Error(message)
  }

  const result = data?.data?.translations?.[0]?.translatedText
  return typeof result === 'string' ? result : null
}

export async function POST(req) {
  try {
    const { text, to, from } = await req.json()

    const str = Array.isArray(text) ? text.join('') : String(text ?? '')
    const target = String(to ?? '').trim()
    const source = String(from ?? '').trim()

    if (!str.trim()) return Response.json({ result: '' })
    if (!target) return Response.json({ result: str })
    if (source && source === target) return Response.json({ result: str })

    try {
      const official = await translateWithGoogleCloud(str, target, source)
      if (official) return Response.json({ result: official })
    } catch (error) {
      console.error('TRANSLATE_CLOUD_FAILED', error?.message || error)
    }

    const options = source ? { from: source, to: target } : { to: target }
    const result = await translate(str, options)
    return Response.json({ result })
  } catch (error) {
    console.error('TRANSLATE_FAILED', error?.message || error)
    return Response.json(
      { result: null, error: 'TRANSLATE_FAILED' },
      { status: 500 },
    )
  }
}
