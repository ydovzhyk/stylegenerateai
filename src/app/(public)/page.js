'use client'

import Link from 'next/link'
import Text from '@/components/shared/text/Text'
import CreateYourLookAnimatedPreview from '@/components/create-your-look/CreateYourLookAnimatedPreview'
import ContactSection from '@/components/contact/ContactSection'
import { useTranslate } from '@/utils/translate/translate'

export default function HomePage() {
  const startCreatingText = useTranslate('Start creating')
  return (
    <div className="flex flex-col gap-12">
      <div className="max-w-3xl">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          site · AI PHOTO STUDIO
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Create Stunning AI Images
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Turn your photos into polished visual styles, professional portraits,
          creative looks, and high-quality AI images with simple tools designed
          for real results.
        </Text>
      </div>

      <section className="flex flex-col gap-6">
        <CreateYourLookAnimatedPreview />

        <div className="flex flex-col items-start gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-2 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
          <Text
            as="p"
            variant="body"
            color="muted"
            caseMode="sentence"
            className="max-w-xl text-sm leading-6 sm:text-base"
          >
            Create your unique look in just a few clicks.
          </Text>

          <Link
            href="/create-your-look"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-transparent bg-[linear-gradient(135deg,#6c4df2_0%,#7c5cff_55%,#8d72ff_100%)] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(124,92,255,0.28)] transition-[background-color,border-color,color,box-shadow,transform] duration-300 hover:translate-y-[-1px] hover:bg-[linear-gradient(135deg,#7a5bff_0%,#8b72ff_55%,#a18dff_100%)] hover:shadow-[0_14px_34px_rgba(124,92,255,0.34)]"
          >
            <span>{startCreatingText || 'Start creating'}</span>
          </Link>
        </div>
      </section>

      <ContactSection />
    </div>
  )
}
