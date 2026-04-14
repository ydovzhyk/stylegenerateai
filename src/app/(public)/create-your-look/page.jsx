'use client'

import Text from '@/components/shared/text/Text'

export default function CreateYourLookPage() {
  return (
    <div>
      <div className="mb-6 max-w-3xl sm:mb-7 md:mb-8">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          site · create-your-look
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Create Your Look
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Transform your photo into a new visual identity with curated AI
          styles. Explore cinematic, fantasy, artistic, and modern looks, then
          generate a polished result in just a few clicks.
        </Text>
      </div>
    </div>
  )
}