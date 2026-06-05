// src/app/(public)/photo-lab/page.jsx
'use client'

import { useRef, useState } from 'react'
import PhotoLabHero from '@/components/photo-lab/PhotoLabHero'
import PhotoLabShowcasePreview from '@/components/photo-lab/PhotoLabShowcasePreview'
import PhotoLabModes from '@/components/photo-lab/PhotoLabModes'
import PhotoLabWorkspace from '@/components/photo-lab/PhotoLabWorkspace'
import { PHOTO_LAB_MODES } from '@/components/photo-lab/photo-lab-modes'

export default function PhotoLabPage() {
  const [selectedModeId, setSelectedModeId] = useState(PHOTO_LAB_MODES[0].id)
  const workspaceRef = useRef(null)

  const selectedMode =
    PHOTO_LAB_MODES.find((mode) => mode.id === selectedModeId) ||
    PHOTO_LAB_MODES[0]

  const scrollToWorkspace = () => {
    const top =
      (workspaceRef.current?.getBoundingClientRect().top || 0) + window.scrollY

    window.scrollTo({
      top: top - 140,
      behavior: 'smooth',
    })
  }

  const handleSelectMode = (modeId) => {
    setSelectedModeId(modeId)

    requestAnimationFrame(() => {
      scrollToWorkspace()
    })
  }

  return (
    <div className="flex flex-col gap-12">
      <PhotoLabHero onStart={scrollToWorkspace} />

      <PhotoLabShowcasePreview />

      <PhotoLabModes
        modes={PHOTO_LAB_MODES}
        selectedModeId={selectedModeId}
        onSelectMode={handleSelectMode}
      />

      <div ref={workspaceRef}>
        <PhotoLabWorkspace selectedMode={selectedMode} />
      </div>
    </div>
  )
}
