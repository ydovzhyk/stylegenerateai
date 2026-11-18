'use client'

import Link from 'next/link'
import Text from '@/components/shared/text/Text'
import PricingPlans from '@/components/pricing/PricingPlans'

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="max-w-3xl">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          pricing / generations
        </Text>

        <Text as="h1" variant="h1" color="white" caseMode="sentence">
          Buy generations for the look you want
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          We sell gen, credits you spend on Create Your Look, Photo Lab,
          Imagine, and Animate. Numbers below are the current draft from our
          pricing library and can change as we finish cost mapping.
        </Text>
      </div>

      <PricingPlans />

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6">
        <Text as="h2" variant="h3" color="white" caseMode="sentence">
          How gen works
        </Text>
        <ul className="mt-4 flex flex-col gap-2 text-sm leading-6 text-white/65">
          <li>
            Each run spends gen from your wallet. The cost depends on the tool,
            export size, and options you pick — a Create Your Look Standard run
            is several gen, and Premium, Print, or heavier modes cost more.
          </li>
          <li>
            Free plans also limit extras (for example how many reference photos
            a mode can use). Exact costs show before you generate as we finish
            cost mapping.
          </li>
          <li>
            Guest and Registered get a free gen wallet with a monthly cap.
            Basic and Pro are paid wallets — gen leave only when you generate.
            Purchase checkout is coming soon; Contact is for business / custom
            packs.
          </li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/#contact"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-cyan-400/35"
          >
            Business / custom pack
          </Link>
          <Link
            href="/create-your-look"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-transparent bg-[linear-gradient(135deg,#6c4df2_0%,#7c5cff_55%,#8d72ff_100%)] px-4 text-sm font-semibold text-white"
          >
            Try with free gen
          </Link>
        </div>
      </section>
    </div>
  )
}
