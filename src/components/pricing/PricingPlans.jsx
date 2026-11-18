'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import { getPlanDefinition } from '@/config/generation-pricing'
import { formatMoney } from '@/config/country-currency'

const PLAN_CARDS = [
  {
    planKey: 'visitor',
    eyebrow: 'Guest',
    blurb: 'Try the studio without an account.',
    features: [
      'Phone-ready size, PNG download',
      'Portrait, square, or landscape',
      'All tools with your free gen',
      'No payment required',
    ],
    cta: { href: '/create-your-look', label: 'Start free', variant: 'secondary' },
  },
  {
    planKey: 'free',
    eyebrow: 'Registered',
    blurb: 'More generations after you sign up.',
    features: [
      'Standard or Premium size, PNG download',
      'Portrait, square, or landscape',
      'All tools unlocked',
      'Save to your gallery',
    ],
    cta: { href: '/register', label: 'Create account', variant: 'secondary' },
  },
  {
    planKey: 'basic',
    eyebrow: 'Basic',
    blurb: 'A gen wallet for regular studio use.',
    features: [
      '120 generations in your wallet',
      'Standard, Premium, or Print size',
      'PNG, JPEG, or WebP download',
      'Portrait, square, or landscape',
      'All tools unlocked',
    ],
    cta: {
      href: '/#contact',
      label: 'Coming soon',
      variant: 'primary',
      disabled: true,
    },
    highlighted: false,
  },
  {
    planKey: 'pro',
    eyebrow: 'Pro',
    blurb: 'The largest gen wallet for heavy studio use.',
    features: [
      '350 generations in your wallet',
      'Standard, Premium, or Print size',
      'PNG, JPEG, or WebP download',
      'Portrait, square, or landscape',
      'All tools unlocked',
    ],
    cta: {
      href: '/#contact',
      label: 'Coming soon',
      variant: 'primary',
      disabled: true,
    },
    highlighted: true,
  },
]

function formatPrice(plan = {}, localeHint = null) {
  if (plan.unlimited) return { main: 'Custom', note: null }
  if (plan.priceUsd == null && plan.priceUah == null) {
    return { main: 'Free', note: null }
  }

  const usd = plan.priceUsd != null ? `$${Number(plan.priceUsd)}` : null
  let note = null
  if (
    plan.priceUsd != null &&
    localeHint?.currency &&
    localeHint.currency !== 'USD' &&
    Number.isFinite(Number(localeHint.rateFromUsd))
  ) {
    const localAmount = Number(plan.priceUsd) * Number(localeHint.rateFromUsd)
    const formatted = formatMoney(localAmount, localeHint.currency)
    if (formatted) note = `≈ ${formatted}`
  }

  return {
    main: usd || (plan.priceUah != null ? `${Number(plan.priceUah)}₴` : 'Free'),
    note,
  }
}

function formatGenSummary(plan = {}) {
  if (plan.unlimited) return 'Unlimited gen'
  const total = plan.totalCredits
  if (total == null) return 'Generations included'
  if (plan.priceUsd != null) return `${total} gen wallet`
  return `${total} gen`
}

function formatLimitLine(plan = {}) {
  if (plan.unlimited) return 'No hard caps for staff use'
  if (plan.priceUsd != null) return 'Use your gen anytime from the wallet'
  if (plan.monthlyLimit != null) return `${plan.monthlyLimit} gen / month`
  return 'Soft trial limits'
}

function ctaClass(variant, disabled = false) {
  if (disabled) {
    return 'inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/40'
  }
  if (variant === 'primary') {
    return 'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-transparent bg-[linear-gradient(135deg,#6c4df2_0%,#7c5cff_55%,#8d72ff_100%)] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(124,92,255,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_14px_34px_rgba(124,92,255,0.34)]'
  }
  return 'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-cyan-400/35 hover:bg-white/[0.06]'
}

export default function PricingPlans() {
  const [localeHint, setLocaleHint] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadLocale() {
      try {
        const res = await fetch('/api/exchange-rates', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.currency && data.rateFromUsd != null) {
          setLocaleHint(data)
        }
      } catch {
        // USD-only fallback
      }
    }
    loadLocale()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_CARDS.map((card) => {
          const plan = getPlanDefinition(card.planKey) || {}
          const price = formatPrice(plan, localeHint)
          const genSummary = formatGenSummary(plan)
          const limitLine = formatLimitLine(plan)

          return (
            <article
              key={card.planKey}
              className={
                card.highlighted
                  ? 'gradient-border-card relative flex h-full flex-col p-5 sm:p-6'
                  : 'relative flex h-full flex-col rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6'
              }
            >
              {card.highlighted ? (
                <span className="absolute right-4 top-4 rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-soft">
                  Popular
                </span>
              ) : null}

              <Text
                as="p"
                variant="caption"
                color="soft"
                caseMode="sentence"
                className="uppercase tracking-[0.18em]"
              >
                {card.eyebrow}
              </Text>

              <Text
                as="h2"
                variant="h3"
                color="white"
                caseMode="sentence"
                className="mt-3"
              >
                {plan.title || card.eyebrow}
              </Text>

              <Text
                as="p"
                variant="body-sm"
                color="muted"
                caseMode="sentence"
                className="mt-2 min-h-10 leading-5"
              >
                {card.blurb}
              </Text>

              <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1">
                <Text as="p" variant="h2" color="white" className="leading-none">
                  {price.main}
                </Text>
                {price.note ? (
                  <Text as="span" variant="body-sm" color="faint">
                    {price.note}
                  </Text>
                ) : null}
              </div>

              <Text
                as="p"
                variant="body-sm"
                color="soft"
                caseMode="sentence"
                className="mt-2"
              >
                {genSummary}
              </Text>
              <Text as="p" variant="caption" color="faint" caseMode="sentence">
                {limitLine}
              </Text>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {card.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-secondary"
                      aria-hidden
                    />
                    <Text
                      as="span"
                      variant="body-sm"
                      color="muted"
                      caseMode="sentence"
                    >
                      {feature}
                    </Text>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {card.cta.disabled ? (
                  <button
                    type="button"
                    disabled
                    className={ctaClass(card.cta.variant, true)}
                  >
                    {card.cta.label}
                  </button>
                ) : (
                  <Link
                    href={card.cta.href}
                    className={ctaClass(card.cta.variant)}
                  >
                    {card.cta.label}
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {localeHint?.currency && localeHint.currency !== 'USD' ? (
        <Text as="p" variant="caption" color="faint" caseMode="sentence">
          Local amounts are approximate ({localeHint.currency}
          {localeHint.country ? `, ${localeHint.country}` : ''}). The exact
          charge is confirmed at payment.
        </Text>
      ) : (
        <Text as="p" variant="caption" color="faint" caseMode="sentence">
          Prices are shown in USD. The exact charge is confirmed at payment.
        </Text>
      )}
    </div>
  )
}
