'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import Text from '@/components/shared/text/Text'
import ImagineModes from '@/components/imagine/ImagineModes'
import ImagineShowcasePreview from '@/components/imagine/ImagineShowcasePreview'
import ImagineWorkspace from '@/components/imagine/ImagineWorkspace'
import { IMAGINE_MODES } from '@/constants/imagine'
import { setAssistantImagineMode } from '@/store/assistant/assistant-slice'
import { getImagineTemplatesState } from '@/store/imagine/imagine-selectors'

const EMPTY_MODE_PREVIEW = { beforeUrl: '', afterUrl: '', title: '' }

function pickRandomTemplatePreviewPair(modeId, templatesByMode) {
  const modeTemplates = templatesByMode?.[modeId] || []
  const pairedTemplates = modeTemplates.filter(
    (item) =>
      String(item?.referenceImageUrl || '').trim() &&
      String(item?.resultImageUrl || '').trim(),
  )

  if (pairedTemplates.length) {
    const template =
      pairedTemplates[Math.floor(Math.random() * pairedTemplates.length)]

    return {
      beforeUrl: String(template.referenceImageUrl).trim(),
      afterUrl: String(template.resultImageUrl).trim(),
      title: String(template.title || '').trim(),
    }
  }

  const resultOnlyTemplates = modeTemplates.filter((item) =>
    String(item?.resultImageUrl || '').trim(),
  )

  if (!resultOnlyTemplates.length) return EMPTY_MODE_PREVIEW

  const template =
    resultOnlyTemplates[Math.floor(Math.random() * resultOnlyTemplates.length)]

  return {
    beforeUrl: '',
    afterUrl: String(template.resultImageUrl).trim(),
    title: String(template.title || '').trim(),
  }
}

export default function ImaginePage() {
  const dispatch = useDispatch()
  const templatesByMode = useSelector(getImagineTemplatesState)
  const [selectedModeId, setSelectedModeId] = useState(null)
  const [selectedModePreview, setSelectedModePreview] = useState(EMPTY_MODE_PREVIEW)
  const workspaceRef = useRef(null)
  const selectedMode = IMAGINE_MODES.find((mode) => mode.id === selectedModeId) || null

  useEffect(() => {
    if (!selectedModeId || selectedModePreview.afterUrl) return

    const previewPair = pickRandomTemplatePreviewPair(
      selectedModeId,
      templatesByMode,
    )

    if (previewPair.afterUrl) {
      setSelectedModePreview(previewPair)
    }
  }, [selectedModeId, selectedModePreview.afterUrl, templatesByMode])

  useEffect(() => {
    return () => {
      dispatch(setAssistantImagineMode(null))
    }
  }, [dispatch])

  const handleSelectMode = (modeId) => {
    setSelectedModeId(modeId)
    dispatch(setAssistantImagineMode(modeId))
    setSelectedModePreview(
      pickRandomTemplatePreviewPair(modeId, templatesByMode),
    )
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
          examplePreview={selectedModePreview}
        />
      </div>
    </div>
  )
}
