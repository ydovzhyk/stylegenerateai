'use client'

import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import { ArrowDown, Sparkles } from 'lucide-react'

export default function PhotoLabHero({ onStart }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
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
          className="max-w-[94%] sm:max-w-none"
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
          Restore old memories, create professional portraits, enhance
          low-quality photos, remove unwanted objects, and edit images with
          simple AI instructions.
        </Text>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={onStart} rightIcon={<ArrowDown size={16} />}>
            Start editing
          </Button>

          <Button variant="secondary" leftIcon={<Sparkles size={16} />}>
            Explore tools
          </Button>
        </div>
      </div>

      <div className="gradient-border-card hidden p-5 lg:block">
        <Text as="p" variant="caption" color="soft" caseMode="sentence">
          One workspace
        </Text>

        <Text
          as="h2"
          variant="h3"
          color="white"
          caseMode="sentence"
          className="mt-2"
        >
          Upload once. Choose a mode. Let AI improve your image.
        </Text>

        <Text
          as="p"
          variant="caption"
          color="muted"
          caseMode="sentence"
          className="mt-3 leading-6"
        >
          Photo Lab will work as a universal AI editing page with different
          modes, not as a collection of separate tools.
        </Text>
      </div>
    </div>
  )
}
