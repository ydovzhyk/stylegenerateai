'use client'



import { useEffect, useMemo, useRef, useState } from 'react'

import { useSelector } from 'react-redux'

import PhotoLabHero from '@/components/photo-lab/PhotoLabHero'

import PhotoLabShowcasePreview from '@/components/photo-lab/PhotoLabShowcasePreview'

import PhotoLabModes from '@/components/photo-lab/PhotoLabModes'

import RestoreStyleModal from '@/components/photo-lab/RestoreStyleModal'

import AiImageWorkspace from '@/components/shared/ai-image-workspace/AiImageWorkspace'

import Text from '@/components/shared/text/Text'

import { PHOTO_LAB_MODES } from '@/components/photo-lab/photo-lab-modes'

import {

  DEFAULT_RESTORE_STYLE,

  RESTORE_COLORIZE_MODE,

  getRestoreStyleMeta,

} from '@/constants/restore-styles'

import { getPhotoLabTemplatesState } from '@/store/photo-lab/photo-lab-selectors'

import { Sparkles } from 'lucide-react'



function pickRandomTemplatePreview(modeId, templatesByMode) {

  const templates = (templatesByMode?.[modeId] || []).filter((item) =>

    String(item?.resultImageUrl || '').trim(),

  )



  if (!templates.length) return ''



  const randomIndex = Math.floor(Math.random() * templates.length)



  return String(templates[randomIndex].resultImageUrl).trim()

}



function buildPhotoLabWorkspaceTemplate(mode, previewUrl = '', restoreStyle = null) {

  if (!mode) return null



  const category =

    mode.id === RESTORE_COLORIZE_MODE && restoreStyle

      ? `${mode.label} · ${getRestoreStyleMeta(restoreStyle).shortLabel}`

      : mode.label



  return {

    id: mode.id,

    title: mode.title,

    category,

    previewUrl,

    promptPlaceholder: mode.promptPlaceholder,

    promptHint: mode.promptHint,

  }

}



export default function PhotoLabPage() {

  const [selectedModeId, setSelectedModeId] = useState(null)

  const [selectedModePreviewUrl, setSelectedModePreviewUrl] = useState('')

  const [restoreStyle, setRestoreStyle] = useState(DEFAULT_RESTORE_STYLE)

  const [restoreStyleModalOpen, setRestoreStyleModalOpen] = useState(false)

  const workspaceRef = useRef(null)

  const templatesByMode = useSelector(getPhotoLabTemplatesState)



  const selectedMode =

    PHOTO_LAB_MODES.find((mode) => mode.id === selectedModeId) || null



  const workspaceTemplate = useMemo(

    () =>

      buildPhotoLabWorkspaceTemplate(

        selectedMode,

        selectedModePreviewUrl,

        selectedModeId === RESTORE_COLORIZE_MODE ? restoreStyle : null,

      ),

    [selectedMode, selectedModePreviewUrl, selectedModeId, restoreStyle],

  )



  useEffect(() => {

    if (!selectedModeId || selectedModePreviewUrl) return



    const previewUrl = pickRandomTemplatePreview(selectedModeId, templatesByMode)



    if (previewUrl) {

      setSelectedModePreviewUrl(previewUrl)

    }

  }, [selectedModeId, selectedModePreviewUrl, templatesByMode])



  const scrollToWorkspace = () => {

    const top =

      (workspaceRef.current?.getBoundingClientRect().top || 0) + window.scrollY



    window.scrollTo({

      top: top - 140,

      behavior: 'smooth',

    })

  }



  const activateRestoreMode = (styleId) => {

    setRestoreStyle(styleId)

    setSelectedModeId(RESTORE_COLORIZE_MODE)

    setSelectedModePreviewUrl(

      pickRandomTemplatePreview(RESTORE_COLORIZE_MODE, templatesByMode),

    )



    requestAnimationFrame(() => {

      scrollToWorkspace()

    })

  }



  const handleSelectMode = (modeId) => {

    if (modeId === RESTORE_COLORIZE_MODE) {

      setRestoreStyleModalOpen(true)

      return

    }



    setSelectedModeId(modeId)

    setSelectedModePreviewUrl(pickRandomTemplatePreview(modeId, templatesByMode))



    requestAnimationFrame(() => {

      scrollToWorkspace()

    })

  }



  const handleRestoreStyleSelect = (styleId) => {

    setRestoreStyleModalOpen(false)

    activateRestoreMode(styleId)

  }



  const handleRestoreStyleModalClose = () => {

    setRestoreStyleModalOpen(false)

  }



  return (

    <div className="flex flex-col gap-12">

      <PhotoLabHero />



      <PhotoLabShowcasePreview />



      <div className="gradient-border-card flex items-start gap-4 p-5 sm:items-center sm:p-6">

        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary-soft">

          <Sparkles size={24} />

        </span>



        <div>

          <Text as="h2" variant="h3" color="white" caseMode="sentence">

            Choose a mode. Upload your photo. Let AI improve it.

          </Text>



          <Text

            as="p"

            variant="body"

            color="muted"

            caseMode="sentence"

            className="mt-2 max-w-2xl text-sm leading-6 sm:text-base"

          >

            Select the tool you need — portrait, restore, enhance, object

            removal, or smart edit — upload your image, and generate a cleaner,

            sharper, more polished result in just a few clicks.

          </Text>

        </div>

      </div>



      <PhotoLabModes

        modes={PHOTO_LAB_MODES}

        selectedModeId={selectedModeId}

        onSelectMode={handleSelectMode}

      />



      <div ref={workspaceRef}>

        <AiImageWorkspace

          template={workspaceTemplate}

          productKey="photo_lab"

          modeKey={selectedMode?.id}

          restoreStyle={

            selectedModeId === RESTORE_COLORIZE_MODE ? restoreStyle : null

          }

          onChangeRestoreStyle={

            selectedModeId === RESTORE_COLORIZE_MODE

              ? () => setRestoreStyleModalOpen(true)

              : null

          }

          emptyStateTitle="Edit your photo"

          emptyStateDescription="Choose a mode above to start editing your photo with AI."

          workspaceTitle="Edit your photo"

          workspaceDescription="Upload your image, choose photo quality, and optionally add small refinements before generating."

          selectionEyebrow="Selected mode"

          promptLabel="Optional refinements"

          showOutputFormat={false}

          actionCardLabels={{

            titleReady: 'Ready to edit',

            descriptionReady: 'Start AI editing with your uploaded photo.',

            descriptionDisabled: 'Upload your photo first to continue.',

          }}

        />

      </div>



      <RestoreStyleModal

        open={restoreStyleModalOpen}

        onSelect={handleRestoreStyleSelect}

        onClose={handleRestoreStyleModalClose}

      />

    </div>

  )

}

