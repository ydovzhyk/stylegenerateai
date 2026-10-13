const API_URL = process.env.NEXT_PUBLIC_API_URL

export function reportClientError(details = {}) {
  const message = String(details.message || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)

  if (!message || !API_URL) return

  const path = String(details.path || '').slice(0, 300)
  if (path.includes('/client-errors')) return
  if (details.code === 'ERR_CANCELED') return

  const status = Number(details.status)
  const page =
    details.page ||
    (typeof window !== 'undefined' ? window.location.pathname : '')

  const payload = {
    source: details.source === 'next-api' ? 'next-api' : 'browser',
    method: String(details.method || '').slice(0, 12),
    path,
    page: String(page || '').slice(0, 300),
    status: Number.isFinite(status) ? status : null,
    code: String(details.code || '').slice(0, 80),
    message,
  }

  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }

  if (typeof window !== 'undefined') {
    request.keepalive = true
  }

  fetch(`${API_URL}/api/client-errors`, request).catch(() => {})
}
