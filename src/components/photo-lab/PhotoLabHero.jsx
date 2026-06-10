'use client'

import Text from '@/components/shared/text/Text'

export default function PhotoLabHero() {
  return (
    <div className="max-w-3xl">
      <Text
        as="p"
        variant="caption"
        color="faint"
        className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
      >
        site · PHOTO LAB
      </Text>

      <Text
        as="h1"
        variant="h1"
        color="white"
        caseMode="sentence"
        className="max-w-[92%] sm:max-w-none"
      >
        AI Photo Studio
      </Text>

      <Text
        as="p"
        variant="body"
        color="muted"
        caseMode="sentence"
        className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
      >
        Restore old memories, create professional portraits, enhance low-quality
        photos, remove unwanted objects, and edit images with simple AI
        instructions.
      </Text>
    </div>
  )
}
