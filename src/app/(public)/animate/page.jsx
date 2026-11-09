'use client'

import { useRef, useState } from 'react'
import Text from '@/components/shared/text/Text'
import AnimateModes from '@/components/animate/AnimateModes'
import AnimateShowcasePreview from '@/components/animate/AnimateShowcasePreview'
import AnimateWorkspace from '@/components/animate/AnimateWorkspace'
import { ANIMATE_MODES } from '@/constants/animate'

export default function AnimatePage() {
  const [selectedModeId, setSelectedModeId] = useState(null)
  const workspaceRef = useRef(null)
  const selectedMode =
    ANIMATE_MODES.find((mode) => mode.id === selectedModeId) || null

  const handleSelectMode = (modeId) => {
    setSelectedModeId(modeId)
    requestAnimationFrame(() => {
      const top =
        (workspaceRef.current?.getBoundingClientRect().top || 0) + window.scrollY
      window.scrollTo({ top: top - 140, behavior: 'smooth' })
    })
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="max-w-3xl">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          site · ANIMATE
        </Text>
        <Text as="h1" variant="h1" color="white" caseMode="sentence">
          Bring your photo to life
        </Text>
        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Upload an Instagram photo, optionally add music, tune Kling settings,
          and generate a short 720p video. More modes can join this page later.
        </Text>
      </div>

      <AnimateShowcasePreview />

      <AnimateModes
        modes={ANIMATE_MODES}
        selectedModeId={selectedModeId}
        onSelectMode={handleSelectMode}
      />

      <div ref={workspaceRef}>
        <AnimateWorkspace key={selectedMode?.id || 'empty'} mode={selectedMode} />
      </div>
    </div>
  )
}
