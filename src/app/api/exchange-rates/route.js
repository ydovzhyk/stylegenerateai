import { NextResponse } from 'next/server'
import {
  currencyForCountry,
  getCurrencyMeta,
  normalizeCountryCode,
  GEO_COUNTRY_COOKIE,
} from '@/config/country-currency'

export const revalidate = 21600 // 6h — enough for pricing hints

function readCountry(request) {
  const fromHeader = normalizeCountryCode(
    request.headers.get('x-vercel-ip-country'),
  )
  if (fromHeader) return fromHeader

  const cookie = request.cookies.get(GEO_COUNTRY_COOKIE)?.value
  return normalizeCountryCode(cookie) || 'US'
}

async function fetchUsdRates(apiKey) {
  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
    { next: { revalidate: 21600 } },
  )

  const data = await res.json().catch(() => null)
  if (!res.ok || data?.result !== 'success') {
    const message =
      data?.['error-type'] || data?.message || `Exchange API ${res.status}`
    throw new Error(message)
  }

  return {
    base: 'USD',
    rates: data.conversion_rates || {},
    updatedAt: data.time_last_update_utc || null,
  }
}

/**
 * GET /api/exchange-rates
 * Returns locale hint data for pricing (country → currency → USD rate).
 * API key stays server-side (EXCHANGE_RATE_API_KEY).
 */
export async function GET(request) {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { message: 'EXCHANGE_RATE_API_KEY is not configured' },
        { status: 503 },
      )
    }

    const country = readCountry(request)
    const currency = currencyForCountry(country)
    const meta = getCurrencyMeta(currency)
    const { base, rates, updatedAt } = await fetchUsdRates(apiKey)
    const rateFromUsd =
      currency === 'USD' ? 1 : Number(rates?.[currency]) || null

    return NextResponse.json({
      country,
      currency: meta.code,
      symbol: meta.symbol,
      currencyName: meta.name,
      base,
      rateFromUsd: Number.isFinite(rateFromUsd) ? rateFromUsd : null,
      updatedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to load exchange rates' },
      { status: 502 },
    )
  }
}
