'use client'

import { useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import ImagineModes from '@/components/imagine/ImagineModes'
import ImagineShowcasePreview from '@/components/imagine/ImagineShowcasePreview'
import ImagineWorkspace from '@/components/imagine/ImagineWorkspace'
import { IMAGINE_MODES } from '@/constants/imagine'

export default function ImaginePage() {
  const [selectedModeId, setSelectedModeId] = useState(null)
  const workspaceRef = useRef(null)
  const selectedMode = IMAGINE_MODES.find((mode) => mode.id === selectedModeId) || null

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
          site · IMAGINE
        </Text>
        <Text as="h1" variant="h1" color="white" caseMode="sentence">
          Generate a new idea
        </Text>
        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Describe a wallpaper, a tattoo sketch, a home design, or a painting.
          Add a reference photo when you want the idea to start from something real.
        </Text>
      </div>

      <ImagineShowcasePreview />

      <div className="gradient-border-card flex items-start gap-4 p-5 sm:items-center sm:p-6">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary-soft">
          <Sparkles size={24} />
        </span>
        <div>
          <Text as="h2" variant="h3" color="white" caseMode="sentence">
            Start from a description
          </Text>
          <Text
            as="p"
            variant="body"
            color="muted"
            caseMode="sentence"
            className="mt-2 max-w-2xl text-sm leading-6 sm:text-base"
          >
            Pick a mode, write what you want, and generate. Wallpaper and Tattoo
            also take a size. Home can start from your photo alone.
          </Text>
        </div>
      </div>

      <ImagineModes
        modes={IMAGINE_MODES}
        selectedModeId={selectedModeId}
        onSelectMode={handleSelectMode}
      />

      <div ref={workspaceRef}>
        <ImagineWorkspace
          key={selectedMode?.id || 'empty'}
          mode={selectedMode}
        />
      </div>
    </div>
  )
}
