'use client'

import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import Text from '@/components/shared/text/Text'
import ImagineModes from '@/components/imagine/ImagineModes'
import ImagineShowcasePreview from '@/components/imagine/ImagineShowcasePreview'
import ImagineWorkspace from '@/components/imagine/ImagineWorkspace'
import { IMAGINE_MODES } from '@/constants/imagine'
import { setAssistantImagineMode } from '@/store/assistant/assistant-slice'

export default function ImaginePage() {
  const dispatch = useDispatch()
  const [selectedModeId, setSelectedModeId] = useState(null)
  const workspaceRef = useRef(null)
  const selectedMode = IMAGINE_MODES.find((mode) => mode.id === selectedModeId) || null

  useEffect(() => {
    return () => {
      dispatch(setAssistantImagineMode(null))
    }
  }, [dispatch])

  const handleSelectMode = (modeId) => {
    setSelectedModeId(modeId)
    dispatch(setAssistantImagineMode(modeId))
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
          Pick a mode, write what you want, and generate a wallpaper, tattoo
          sketch, home design, or painting. Wallpaper and Tattoo also take a
          size. Home can start from your photo alone. Add a reference photo when
          you want the idea to start from something real.
        </Text>
      </div>

      <ImagineShowcasePreview />

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
