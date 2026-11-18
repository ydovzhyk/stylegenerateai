import { NextResponse } from 'next/server'
import {
  GEO_COUNTRY_COOKIE,
  normalizeCountryCode,
} from '@/config/country-currency'

function countryFromAcceptLanguage(header) {
  const text = String(header || '')
  const match = text.match(/-[A-Za-z]{2}\b/)
  return normalizeCountryCode(match ? match[0].slice(1) : null)
}

export function proxy(request) {
  const fromGeo =
    normalizeCountryCode(request.geo?.country) ||
    normalizeCountryCode(request.headers.get('x-vercel-ip-country'))

  const fromLanguage = countryFromAcceptLanguage(
    request.headers.get('accept-language'),
  )

  const country = fromGeo || fromLanguage || 'US'
  const response = NextResponse.next()

  response.cookies.set(GEO_COUNTRY_COOKIE, country, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
