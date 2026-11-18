/**
 * ISO country → ISO currency for pricing hints.
 * Unknown countries fall back to USD (no secondary hint).
 */
const COUNTRY_CURRENCY = {
  US: 'USD',
  PR: 'USD',
  GU: 'USD',
  AS: 'USD',
  MP: 'USD',
  VI: 'USD',

  UA: 'UAH',
  GB: 'GBP',
  UK: 'GBP',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  CY: 'EUR',
  HR: 'EUR',

  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  CH: 'CHF',
  IS: 'ISK',

  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  HK: 'HKD',
  SG: 'SGD',
  TW: 'TWD',
  IN: 'INR',
  ID: 'IDR',
  MY: 'MYR',
  TH: 'THB',
  PH: 'PHP',
  VN: 'VND',

  BR: 'BRL',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',

  TR: 'TRY',
  IL: 'ILS',
  AE: 'AED',
  SA: 'SAR',
  EG: 'EGP',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',

  RU: 'RUB',
  KZ: 'KZT',
  GE: 'GEL',
  AM: 'AMD',
  AZ: 'AZN',
  MD: 'MDL',
}

const CURRENCY_META = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  UAH: { symbol: '₴', name: 'Ukrainian Hryvnia' },
  PLN: { symbol: 'zł', name: 'Polish Zloty' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint' },
  RON: { symbol: 'lei', name: 'Romanian Leu' },
  BGN: { symbol: 'лв', name: 'Bulgarian Lev' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { symbol: 'kr', name: 'Danish Krone' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  ISK: { symbol: 'kr', name: 'Icelandic Krona' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { symbol: 'AU$', name: 'Australian Dollar' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
  THB: { symbol: '฿', name: 'Thai Baht' },
  PHP: { symbol: '₱', name: 'Philippine Peso' },
  VND: { symbol: '₫', name: 'Vietnamese Dong' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso' },
  ARS: { symbol: 'AR$', name: 'Argentine Peso' },
  CLP: { symbol: 'CL$', name: 'Chilean Peso' },
  COP: { symbol: 'CO$', name: 'Colombian Peso' },
  PEN: { symbol: 'S/', name: 'Peruvian Sol' },
  TRY: { symbol: '₺', name: 'Turkish Lira' },
  ILS: { symbol: '₪', name: 'Israeli Shekel' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  RUB: { symbol: '₽', name: 'Russian Ruble' },
  KZT: { symbol: '₸', name: 'Kazakhstani Tenge' },
  GEL: { symbol: '₾', name: 'Georgian Lari' },
  AMD: { symbol: '֏', name: 'Armenian Dram' },
  AZN: { symbol: '₼', name: 'Azerbaijani Manat' },
  MDL: { symbol: 'L', name: 'Moldovan Leu' },
}

export const GEO_COUNTRY_COOKIE = 'sg_country'

export function normalizeCountryCode(value) {
  const code = String(value || '')
    .trim()
    .toUpperCase()
  if (code === 'UK') return 'GB'
  if (/^[A-Z]{2}$/.test(code)) return code
  return null
}

export function currencyForCountry(countryCode) {
  const country = normalizeCountryCode(countryCode)
  if (!country) return 'USD'
  return COUNTRY_CURRENCY[country] || 'USD'
}

export function getCurrencyMeta(currencyCode) {
  const code = String(currencyCode || 'USD').toUpperCase()
  return {
    code,
    ...(CURRENCY_META[code] || { symbol: code, name: code }),
  }
}

export function formatMoney(amount, currencyCode, locale = undefined) {
  const code = String(currencyCode || 'USD').toUpperCase()
  const value = Number(amount)
  if (!Number.isFinite(value)) return null

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: code === 'JPY' || code === 'KRW' || code === 'VND' ? 0 : 0,
      minimumFractionDigits: 0,
    }).format(value)
  } catch {
    const meta = getCurrencyMeta(code)
    return `${meta.symbol}${Math.round(value)}`
  }
}
