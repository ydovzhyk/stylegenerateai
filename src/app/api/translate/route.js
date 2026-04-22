import translate from 'translate'

translate.key = process.env.TRANSLATE_API_KEY

export async function POST(req) {
  try {
    const { text, to, from } = await req.json()

    const str = Array.isArray(text) ? text.join('') : String(text ?? '')
    const target = String(to ?? '').trim()
    const source = String(from ?? '').trim()

    if (!str.trim()) return Response.json({ result: '' })
    if (!target) return Response.json({ result: str })
    if (source && source === target) return Response.json({ result: str })

    const options = source ? { from: source, to: target } : { to: target }

    const result = await translate(str, options)
    return Response.json({ result })
  } catch {
    return Response.json(
      { result: null, error: 'TRANSLATE_FAILED' },
      { status: 500 },
    )
  }
}
