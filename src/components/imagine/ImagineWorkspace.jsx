'use client'

import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import { ImagePlus, Maximize2, Sparkles } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import GenerationOptionsPanel from '@/components/shared/ai-image-workspace/GenerationOptionsPanel'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import InfoHint from '@/components/shared/info-hint/InfoHint'
import Photo from '@/components/shared/photo/Photo'
import { PHOTO_OVERLAY_TEXT_OUTLINE } from '@/components/shared/preview-badge/PreviewBadge'
import BeforeAfterComparisonSlider, {
  ComparisonPreviewBadge,
  resolveComparisonPreviewTarget,
} from '@/components/shared/before-after-comparison/BeforeAfterComparisonSlider'
import useGenerationPlanAccess from '@/hooks/useGenerationPlanAccess'
import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import { queueAssistantNotice } from '@/store/assistant/assistant-slice'
import { axiosGenerateImagine } from '@/services/api/imagine'
import {
  PAINTING_CANVAS_PRESETS,
  PAINTING_TECHNIQUES,
  TATTOO_REFERENCE_PROMPT_EXAMPLE,
  TATTOO_STYLES,
  WALLPAPER_PRESETS,
} from '@/constants/imagine'
import {
  PHOTO_CHECK_FAILED_MESSAGE,
  PHOTO_CHECK_PENDING_MESSAGE,
  PHOTO_FLAGGED_MESSAGE,
  imageCheckKey,
  moderateUploadedImage,
} from '@/utils/moderation/moderate-image'

const PREVIEW_FRAME_CLASS =
  'group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[26px] border bg-background-soft/70 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:aspect-[5/6] lg:aspect-[4/5]'

function inputsReadyFor(modeId, prompt, placeFile, referenceFile) {
  const promptReady = String(prompt || '').trim().length > 0
  if (modeId === 'wallpaper') return true
  if (modeId === 'tattoo') return promptReady
  if (modeId === 'home') return Boolean(placeFile)
  if (modeId === 'painting') return promptReady || Boolean(referenceFile)
  return false
}

function useObjectUrl(file) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!file) {
      setUrl('')
      return undefined
    }

    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  return url
}

function SizeField({ id, label, value, onChange, suffix }) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <Text as="span" variant="caption" color="faint" caseMode="sentence">
        {label}
      </Text>
      <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <input
          id={id}
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none"
        />
        <Text as="span" variant="caption" color="faint">
          {suffix}
        </Text>
      </span>
    </label>
  )
}

function SourceButton({ label, uploaded, disabled, onClick }) {
  return (
    <Button
      type="button"
      variant="secondary"
      shape="soft"
      active={uploaded}
      disabled={disabled}
      fullWidth
      onClick={onClick}
      className="justify-start gap-3 px-4 py-3 font-medium"
      leftIcon={
        <span
          aria-hidden
          className={clsx(
            'h-4 w-4 shrink-0 rounded-full border',
            uploaded
              ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_#12141c]'
              : 'border-white/40 bg-transparent',
          )}
        />
      }
    >
      {label}
    </Button>
  )
}

function ChoiceGrid({ items, activeId, onSelect, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant="secondary"
          shape="soft"
          active={activeId === item.id}
          disabled={disabled}
          fullWidth
          onClick={() => onSelect(item.id)}
          className="justify-start px-4 py-3 text-left font-medium"
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

export default function ImagineWorkspace({ mode, examplePreview = null }) {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)
  const {
    creditCost,
    planHint,
    photoQuality,
    setPhotoQuality,
    photoQualities,
    isQualityAllowed,
    lockedText,
  } = useGenerationPlanAccess({
    productKey: 'imagine',
  })

  const referenceInputRef = useRef(null)
  const placeInputRef = useRef(null)
  const renovationInputRef = useRef(null)
  const moderationSerialRef = useRef(new Map())

  const [prompt, setPrompt] = useState('')
  const [wallpaperWidth, setWallpaperWidth] = useState('0')
  const [wallpaperHeight, setWallpaperHeight] = useState('0')
  const [wallpaperScreenLabel, setWallpaperScreenLabel] = useState('')
  const [tattooWidth, setTattooWidth] = useState('5')
  const [tattooHeight, setTattooHeight] = useState('10')
  const [tattooStyle, setTattooStyle] = useState('custom')
  const [technique, setTechnique] = useState('original')
  const [paintingWidth, setPaintingWidth] = useState('0')
  const [paintingHeight, setPaintingHeight] = useState('0')
  const [paintingCanvasLabel, setPaintingCanvasLabel] = useState('')
  const [referenceFile, setReferenceFile] = useState(null)
  const [placeFile, setPlaceFile] = useState(null)
  const [renovationFile, setRenovationFile] = useState(null)
  const [imageChecks, setImageChecks] = useState({})
  const [previewUrl, setPreviewUrl] = useState('')
  const [homeStyleLabel, setHomeStyleLabel] = useState('')
  const [wallpaperThemeLabel, setWallpaperThemeLabel] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })
  const [comparisonSliderPosition, setComparisonSliderPosition] = useState(100)

  const referencePreview = useObjectUrl(referenceFile)
  const placePreview = useObjectUrl(placeFile)
  const designExamplePreview = useObjectUrl(renovationFile)

  const queueCheck = (file) => {
    if (!file) return
    const key = imageCheckKey(file)
    const serial = (moderationSerialRef.current.get(key) || 0) + 1
    moderationSerialRef.current.set(key, serial)
    setImageChecks((prev) => ({ ...prev, [key]: 'pending' }))

    moderateUploadedImage(file)
      .then((result) => {
        if (moderationSerialRef.current.get(key) !== serial) return
        setImageChecks((prev) => ({
          ...prev,
          [key]: result.flagged ? 'flagged' : 'clear',
        }))
      })
      .catch(() => {
        if (moderationSerialRef.current.get(key) !== serial) return
        setImageChecks((prev) => ({ ...prev, [key]: 'error' }))
      })
  }

  const filesForMode = [
    mode?.id === 'home' ? placeFile : referenceFile,
    mode?.id === 'home' ? renovationFile : null,
  ].filter(Boolean)

  const checkState = filesForMode.map(
    (file) => imageChecks[imageCheckKey(file)] || 'pending',
  )
  const checkPending = checkState.includes('pending')
  const checkFlagged = checkState.includes('flagged')
  const checkFailed = checkState.includes('error')

  const reportError = (message) => {
    setError(message)
    toast.error(message)
    dispatch(queueAssistantNotice({ message }))
  }

  const openImagePreview = ({ src, alt, title }) => {
    if (!src) return
    setPreviewModal({ open: true, src, alt, title })
  }

  const handleGenerate = async () => {
    if (!mode) return
    if (checkPending) {
      reportError(PHOTO_CHECK_PENDING_MESSAGE)
      return
    }
    if (checkFlagged) {
      reportError(PHOTO_FLAGGED_MESSAGE)
      return
    }
    if (checkFailed) {
      reportError(PHOTO_CHECK_FAILED_MESSAGE)
      return
    }
    if (!inputsReadyFor(mode.id, prompt, placeFile, referenceFile)) return

    const formData = new FormData()
    formData.append('mode', mode.id)
    formData.append('prompt', prompt.trim())
    formData.append('photoQuality', photoQuality || 'draft')

    if (!isLogin && visitorId) {
      formData.append('visitorId', visitorId)
    }

    if (mode.id === 'wallpaper') {
      formData.append('width', wallpaperWidth)
      formData.append('height', wallpaperHeight)
      if (referenceFile) formData.append('reference', referenceFile)
    }

    if (mode.id === 'tattoo') {
      formData.append('widthCm', tattooWidth)
      formData.append('heightCm', tattooHeight)
      formData.append('tattooStyle', tattooStyle)
      if (referenceFile) formData.append('reference', referenceFile)
    }

    if (mode.id === 'home') {
      if (placeFile) formData.append('place', placeFile)
      if (renovationFile) formData.append('renovation', renovationFile)
    }

    if (mode.id === 'painting') {
      formData.append('technique', technique)
      formData.append('width', paintingWidth)
      formData.append('height', paintingHeight)
      if (referenceFile) formData.append('reference', referenceFile)
    }

    setError('')
    setIsGenerating(true)

    try {
      const data = await axiosGenerateImagine(formData)
      const nextPreview = data?.previewUrl || ''
      if (!nextPreview) {
        throw new Error('Generation failed. Please try again.')
      }
      setPreviewUrl(nextPreview)
      const nextStyle =
        data?.homeStyle?.label || data?.resultPayload?.homeStyle?.label || ''
      setHomeStyleLabel(nextStyle)
      setWallpaperThemeLabel(
        data?.wallpaperTheme?.label ||
          data?.resultPayload?.wallpaperTheme?.label ||
          '',
      )
      const screen =
        data?.wallpaperScreen || data?.resultPayload?.wallpaperScreen || null
      const paintingCanvas =
        data?.paintingCanvas || data?.resultPayload?.paintingCanvas || null
      const output = data?.output || data?.resultPayload?.output || null
      if (screen?.width && screen?.height) {
        setWallpaperWidth(String(screen.width))
        setWallpaperHeight(String(screen.height))
        setWallpaperScreenLabel(
          screen.device
            ? `${screen.device} · ${screen.width}×${screen.height}`
            : `${screen.width}×${screen.height}`,
        )
      } else if (mode.id === 'wallpaper' && output?.width && output?.height) {
        setWallpaperScreenLabel(`${output.width}×${output.height}`)
      } else {
        setWallpaperScreenLabel('')
      }
      if (paintingCanvas?.width && paintingCanvas?.height) {
        setPaintingCanvasLabel(
          paintingCanvas.label
            ? `${paintingCanvas.label} · ${paintingCanvas.width}×${paintingCanvas.height}`
            : `${paintingCanvas.width}×${paintingCanvas.height}`,
        )
      } else if (mode.id === 'painting' && output?.width && output?.height) {
        setPaintingCanvasLabel(`${output.width}×${output.height}`)
      } else {
        setPaintingCanvasLabel('')
      }
      dispatch(getGenerationUsage())
    } catch (generateError) {
      reportError(
        generateError?.response?.data?.message ||
          generateError?.message ||
          'Generation failed. Please try again.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  if (!mode) {
    return (
      <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          Generate an idea
        </Text>
        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          Choose a mode above to start.
        </Text>
      </section>
    )
  }

  const isHome = mode.id === 'home'
  const uploadFile = isHome ? placeFile : referenceFile
  const uploadPreview = isHome ? placePreview : referencePreview
  const uploadLabel = isHome ? 'Your place' : 'Reference photo'
  const inputsReady = inputsReadyFor(mode.id, prompt, placeFile, referenceFile)
  const promptOptional = mode.id === 'home' || mode.id === 'wallpaper'
  const promptPlaceholder =
    mode.id === 'tattoo'
      ? tattooStyle === 'custom' && referenceFile
        ? TATTOO_REFERENCE_PROMPT_EXAMPLE
        : TATTOO_STYLES.find((style) => style.id === tattooStyle)?.promptExample ||
          mode.promptPlaceholder
      : mode.promptPlaceholder
  const missingHint = inputsReady
    ? ''
    : mode.id === 'home'
      ? 'Upload a photo of your place to generate.'
      : mode.id === 'painting'
        ? 'Write a prompt or add a photo to generate.'
        : 'Write a prompt to generate.'
  const blockedHint = checkFlagged
    ? PHOTO_FLAGGED_MESSAGE
    : checkFailed
      ? PHOTO_CHECK_FAILED_MESSAGE
      : checkPending
        ? PHOTO_CHECK_PENDING_MESSAGE
        : missingHint
  const resultCaption = [
    homeStyleLabel ? `Style: ${homeStyleLabel}` : '',
    wallpaperThemeLabel ? `Theme: ${wallpaperThemeLabel}` : '',
    wallpaperScreenLabel ? `Screen: ${wallpaperScreenLabel}` : '',
    paintingCanvasLabel ? `Canvas: ${paintingCanvasLabel}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const paintingLookOptions = PAINTING_TECHNIQUES.map((item) => ({
    value: item.id,
    label: item.label,
  }))
  const selectedPaintingLook =
    paintingLookOptions.find((option) => option.value === technique) || null
  const paintingCanvasOptions = PAINTING_CANVAS_PRESETS.map((item) => ({
    value: item.id,
    label: item.label,
    width: item.width,
    height: item.height,
  }))
  const selectedPaintingCanvas =
    paintingCanvasOptions.find(
      (option) =>
        paintingWidth === String(option.width) &&
        paintingHeight === String(option.height),
    ) || null
  const tattooStyleOptions = TATTOO_STYLES.map((item) => ({
    value: item.id,
    label: item.label,
  }))
  const selectedTattooStyle =
    tattooStyleOptions.find((option) => option.value === tattooStyle) || null

  const pickPrimaryPhoto = () => {
    if (isHome) placeInputRef.current?.click()
    else referenceInputRef.current?.click()
  }

  const exampleBefore = String(examplePreview?.beforeUrl || '').trim()
  const exampleAfter = String(examplePreview?.afterUrl || '').trim()
  const exampleTitle = String(examplePreview?.title || '').trim() || mode.title
  const exampleComparison =
    exampleBefore && exampleAfter
      ? {
          beforeUrl: exampleBefore,
          afterUrl: exampleAfter,
          beforeLabel: 'Your photo',
          afterLabel: 'Generated',
        }
      : null

  return (
    <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
      <div className="mb-6">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          Generate an idea
        </Text>
        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          {mode.workspaceHint || mode.description}
        </Text>
      </div>

      <div className="mb-5 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3 self-start overflow-visible md:col-start-1 lg:col-start-2 lg:row-start-1">
          <div
            className={clsx(
              'relative overflow-visible rounded-2xl border border-white/10 bg-background-soft/70',
              isHome ? 'px-3 pb-3' : 'p-4',
            )}
          >
            {isHome ? (
              <>
                <div className="absolute right-3 top-3 z-20">
                  <InfoHint
                    text="Your place is required. A design example is optional, even from another house or room. The result is one photo of your place."
                    label="Your place hint"
                    align="end"
                  />
                </div>
                {/* top-3 + Info(14px) + top-3 - clears the absolute hint, mirrors edge inset below */}
                <div className="mt-[calc(0.75rem+14px+0.75rem)] grid grid-cols-2 gap-2">
                  <SourceButton
                    label="Your place"
                    uploaded={Boolean(placeFile)}
                    disabled={isGenerating}
                    onClick={() => placeInputRef.current?.click()}
                  />
                  <SourceButton
                    label="Design example"
                    uploaded={Boolean(renovationFile)}
                    disabled={isGenerating || !placeFile}
                    onClick={() => renovationInputRef.current?.click()}
                  />
                </div>
              </>
            ) : null}

            {mode.id === 'wallpaper' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Text as="p" variant="body" color="white" caseMode="sentence">
                    Screen size
                  </Text>
                  <InfoHint
                    text="Leave both sizes at 0. A reference photo keeps its size and scene. With no photo, a device in the prompt sets the screen, or the wallpaper is 1920×1080."
                    label="Screen size hint"
                    align="end"
                  />
                </div>
                <ChoiceGrid
                  items={WALLPAPER_PRESETS}
                  activeId={
                    WALLPAPER_PRESETS.find(
                      (preset) =>
                        wallpaperWidth === String(preset.width) &&
                        wallpaperHeight === String(preset.height),
                    )?.id
                  }
                  disabled={isGenerating}
                  onSelect={(presetId) => {
                    const preset = WALLPAPER_PRESETS.find((item) => item.id === presetId)
                    if (!preset) return
                    setWallpaperWidth(String(preset.width))
                    setWallpaperHeight(String(preset.height))
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <SizeField
                    id="wallpaper-width"
                    label="Width"
                    value={wallpaperWidth}
                    suffix="px"
                    onChange={setWallpaperWidth}
                  />
                  <SizeField
                    id="wallpaper-height"
                    label="Height"
                    value={wallpaperHeight}
                    suffix="px"
                    onChange={setWallpaperHeight}
                  />
                </div>
              </div>
            ) : null}

            {mode.id === 'tattoo' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Text as="p" variant="body" color="white" caseMode="sentence">
                    Tattoo style
                  </Text>
                  <InfoHint
                    text="With a reference photo, choose Custom and write: Make this same subject a clean sketch. Other styles redraw the subject in that technique."
                    label="Tattoo style hint"
                    align="end"
                  />
                </div>
                <Select
                  id="tattoo-style"
                  options={tattooStyleOptions}
                  value={selectedTattooStyle}
                  onChange={(option) => {
                    if (!option?.value) return
                    setTattooStyle(option.value)
                  }}
                  isDisabled={isGenerating}
                  isSearchable={false}
                  isClearable={false}
                  placeholder="Select style"
                  hideHelp
                />
                <div className="grid grid-cols-2 gap-2">
                  <SizeField
                    id="tattoo-width"
                    label="Width"
                    value={tattooWidth}
                    suffix="cm"
                    onChange={setTattooWidth}
                  />
                  <SizeField
                    id="tattoo-height"
                    label="Height"
                    value={tattooHeight}
                    suffix="cm"
                    onChange={setTattooHeight}
                  />
                </div>
              </div>
            ) : null}

            {mode.id === 'painting' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Text as="p" variant="body" color="white" caseMode="sentence">
                    Look
                  </Text>
                  <InfoHint
                    text="As original, as a photo, or as oil, pencil, or gouache. Name a painting or artist in the prompt, or upload a reference photo."
                    label="Look hint"
                    align="end"
                  />
                </div>
                <Select
                  id="painting-look"
                  options={paintingLookOptions}
                  value={selectedPaintingLook}
                  onChange={(option) => {
                    if (!option?.value) return
                    setTechnique(option.value)
                  }}
                  isDisabled={isGenerating}
                  isSearchable={false}
                  isClearable={false}
                  placeholder="Select look"
                  hideHelp
                />
                <div className="flex items-center justify-between gap-3">
                  <Text as="p" variant="body" color="white" caseMode="sentence">
                    Canvas size
                  </Text>
                  <InfoHint
                    text="Auto leaves both sizes at 0. A reference photo keeps its proportions. A named famous painting uses that work’s natural proportions. Otherwise the canvas is 1024×1024 square."
                    label="Canvas size hint"
                    align="end"
                  />
                </div>
                <Select
                  id="painting-canvas"
                  options={paintingCanvasOptions}
                  value={selectedPaintingCanvas}
                  onChange={(option) => {
                    if (!option) return
                    setPaintingWidth(String(option.width ?? 0))
                    setPaintingHeight(String(option.height ?? 0))
                  }}
                  isDisabled={isGenerating}
                  isSearchable={false}
                  isClearable={false}
                  placeholder="Custom size"
                  hideHelp
                />
                <div className="grid grid-cols-2 gap-2">
                  <SizeField
                    id="painting-width"
                    label="Width"
                    value={paintingWidth}
                    suffix="px"
                    onChange={setPaintingWidth}
                  />
                  <SizeField
                    id="painting-height"
                    label="Height"
                    value={paintingHeight}
                    suffix="px"
                    onChange={setPaintingHeight}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden min-w-0 lg:col-start-1 lg:row-start-2 lg:block">
        <div className={`${PREVIEW_FRAME_CLASS} border-white/10`}>
          {exampleComparison ? (
            <>
              <BeforeAfterComparisonSlider
                beforeSrc={exampleComparison.beforeUrl}
                afterSrc={exampleComparison.afterUrl}
                beforeLabel={exampleComparison.beforeLabel}
                afterLabel={exampleComparison.afterLabel}
                objectPosition="50% 50%"
                onPositionChange={setComparisonSliderPosition}
                showLabels={false}
                className="absolute inset-0"
              />
              <button
                type="button"
                onClick={() =>
                  openImagePreview(
                    resolveComparisonPreviewTarget(
                      exampleComparison,
                      comparisonSliderPosition,
                      { title: exampleTitle },
                    ),
                  )
                }
                className="absolute right-3 top-3 z-[3] hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:bg-black/40 hover:text-white group-hover:opacity-100 lg:inline-flex"
                aria-label="Open image preview"
              >
                <Maximize2 size={15} />
              </button>
              <ComparisonPreviewBadge
                beforeLabel={exampleComparison.beforeLabel}
                afterLabel={exampleComparison.afterLabel}
                position={comparisonSliderPosition}
                shineSeed={`${mode.id}-${exampleComparison.afterUrl}`}
                wrapperClassName="pointer-events-none absolute bottom-4 right-4 z-[5]"
              />
            </>
          ) : exampleAfter ? (
            <>
              <button
                type="button"
                onClick={() =>
                  openImagePreview({
                    src: exampleAfter,
                    alt: exampleTitle,
                    title: exampleTitle,
                  })
                }
                className="absolute inset-0 z-[1] cursor-zoom-in"
                aria-label="Open image preview: Generated"
              />
              <Photo
                src={exampleAfter}
                alt={exampleTitle}
                fill
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-center"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.04] via-transparent to-primary/10 px-5 text-center">
              <Text as="p" variant="caption" color="soft" caseMode="sentence">
                Selected mode
              </Text>
              <Text as="p" variant="body" color="white" caseMode="sentence" className="mt-2">
                {mode.title}
              </Text>
              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-4 max-w-[220px]"
              >
                A before and after example will appear here when one is saved.
              </Text>
            </div>
          )}

          {exampleAfter ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4">
              <Text
                as="p"
                variant="caption"
                color="soft"
                caseMode="sentence"
                className={PHOTO_OVERLAY_TEXT_OUTLINE}
              >
                Selected mode
              </Text>
              <Text
                as="p"
                variant="body"
                color="white"
                className={clsx('mt-1 line-clamp-1', PHOTO_OVERLAY_TEXT_OUTLINE)}
              >
                {exampleTitle}
              </Text>
              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className={clsx('mt-1 line-clamp-1', PHOTO_OVERLAY_TEXT_OUTLINE)}
              >
                {mode.title}
              </Text>
            </div>
          ) : null}
        </div>
        </div>

        <div
          className={clsx(
            PREVIEW_FRAME_CLASS,
            'md:col-start-1 lg:col-start-2 lg:row-start-2',
            uploadPreview ? 'border-white/10' : 'border-dashed border-white/15',
          )}
        >
          {uploadPreview ? (
            <>
              <button
                type="button"
                onClick={() =>
                  openImagePreview({
                    src: uploadPreview,
                    alt: uploadLabel,
                    title: uploadFile?.name || uploadLabel,
                  })
                }
                className="absolute inset-0 z-[1] cursor-zoom-in"
                aria-label={`Open image preview: ${uploadLabel}`}
              />
              <Photo
                src={uploadPreview}
                alt={uploadLabel}
                fill
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-center"
              />
              {isHome && designExamplePreview ? (
                <button
                  type="button"
                  onClick={() =>
                    openImagePreview({
                      src: designExamplePreview,
                      alt: 'Design example',
                      title: renovationFile?.name || 'Design example',
                    })
                  }
                  className="absolute bottom-[18%] right-3 z-[3] w-[28%] cursor-zoom-in overflow-hidden rounded-2xl border border-white/25 bg-black/40 shadow-[0_10px_28px_rgba(0,0,0,0.45)] sm:bottom-4 sm:right-4"
                  aria-label="Open image preview: Design example"
                >
                  <span className="relative block aspect-[4/5] w-full">
                    <Photo
                      src={designExamplePreview}
                      alt="Design example"
                      fill
                      sizes="120px"
                      className="object-center"
                    />
                    <span
                      className={clsx(
                        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-1.5 py-1.5 text-center text-[9px] uppercase tracking-[0.14em] text-white/85',
                        PHOTO_OVERLAY_TEXT_OUTLINE,
                      )}
                    >
                      Design example
                    </span>
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  openImagePreview({
                    src: uploadPreview,
                    alt: uploadLabel,
                    title: uploadFile?.name || uploadLabel,
                  })
                }
                className="absolute right-3 top-3 z-[3] hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 backdrop-blur-md transition hover:bg-black/40 hover:text-white group-hover:inline-flex"
                aria-label="Open image preview"
              >
                <Maximize2 size={15} />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4">
                <Text
                  as="p"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                  className={PHOTO_OVERLAY_TEXT_OUTLINE}
                >
                  {uploadLabel}
                </Text>
                <Text
                  as="p"
                  variant="body"
                  color="white"
                  translate={false}
                  className={clsx('mt-1 line-clamp-1', PHOTO_OVERLAY_TEXT_OUTLINE)}
                >
                  {uploadFile?.name || uploadLabel}
                </Text>
                <div className="pointer-events-auto mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={pickPrimaryPhoto}
                    disabled={isGenerating}
                    className="h-[38px] rounded-full border-white/10 bg-white/[0.08] px-5 hover:bg-white/[0.12]"
                  >
                    Change photo
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={pickPrimaryPhoto}
              disabled={isGenerating}
              className="flex h-full w-full flex-col items-center justify-center p-5 text-center transition hover:bg-white/[0.035]"
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
                <ImagePlus size={24} />
              </span>
              <Text as="span" variant="body" color="white" caseMode="sentence">
                {isHome
                  ? 'Upload your place'
                  : mode.id === 'tattoo'
                    ? 'Upload a reference'
                    : 'Upload a reference photo'}
              </Text>
              <Text
                as="span"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-2 max-w-[260px]"
              >
                {isHome
                  ? 'A photo of the house, yard, or room you want to redesign.'
                  : mode.id === 'wallpaper'
                    ? 'Optional. Add it to keep this picture and change only what you describe. Or start from the prompt alone.'
                    : mode.id === 'tattoo'
                      ? 'Optional. You get a clean sketch for your artist, not a tattoo on skin. Describe the design in the prompt.'
                      : 'Optional. The idea can also start from the prompt alone.'}
              </Text>
            </button>
          )}
        </div>

        <div
          className={clsx(
            PREVIEW_FRAME_CLASS,
            'md:col-start-2 lg:col-start-3 lg:row-start-2',
            previewUrl ? 'border-white/10' : 'border-dashed border-white/15',
          )}
        >
          {previewUrl ? (
            <>
              <button
                type="button"
                onClick={() =>
                  openImagePreview({
                    src: previewUrl,
                    alt: `${mode.title} result`,
                    title: `${mode.title} result`,
                  })
                }
                className="absolute inset-0 z-[1] cursor-zoom-in"
                aria-label="Open image preview: Generated"
              />
              <Photo
                src={previewUrl}
                alt={`${mode.title} result`}
                fill
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-center"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4">
                <Text
                  as="p"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                  className={PHOTO_OVERLAY_TEXT_OUTLINE}
                >
                  AI generated result
                </Text>
                <Text
                  as="p"
                  variant="body"
                  color="white"
                  caseMode="sentence"
                  className={clsx('mt-1', PHOTO_OVERLAY_TEXT_OUTLINE)}
                >
                  Your idea is ready
                </Text>
                {resultCaption ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="muted"
                    translate={false}
                    className={clsx(
                      'mt-1 line-clamp-2',
                      PHOTO_OVERLAY_TEXT_OUTLINE,
                    )}
                  >
                    {resultCaption}
                  </Text>
                ) : null}
              </div>
            </>
          ) : (
            <div className="px-6 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
                <Sparkles size={24} />
              </span>
              <Text as="p" variant="body" color="white" caseMode="sentence">
                Result preview
              </Text>
              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-2 max-w-[260px]"
              >
                The generated idea will appear here.
              </Text>
            </div>
          )}
        </div>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        <div className="flex h-full min-h-[360px] flex-col rounded-[26px] border border-white/10 bg-white/[0.025] p-5">
          <Input
            id="imagine-prompt"
            as="textarea"
            rows={5}
            label={promptOptional ? 'Optional prompt' : 'Prompt'}
            labelClassName="text-lg font-semibold text-white md:text-xl"
            placeholder={promptPlaceholder}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            caseMode="sentence"
            className="flex h-full min-h-0 flex-1 flex-col [&>div]:flex [&>div]:min-h-0 [&>div]:flex-1"
            inputClassName="h-full min-h-0 flex-1 resize-none"
            helpClassName="hidden"
          />
        </div>

        <div className="flex flex-col gap-3">
          <GenerationOptionsPanel
            showPrompt={false}
            showOutputFormat={false}
            photoQuality={photoQuality}
            setPhotoQuality={setPhotoQuality}
            photoQualities={photoQualities}
            isQualityAllowed={isQualityAllowed}
            lockedText={lockedText}
            photoQualityLabel="Export size"
          />
        </div>

        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.025] p-5 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
            <Sparkles size={24} />
          </span>
          <Text as="p" variant="body" color="white" caseMode="sentence">
            {previewUrl ? 'Ready to try again' : 'Ready to generate'}
          </Text>
          <Text
            as="p"
            variant="caption"
            color="muted"
            caseMode="sentence"
            className="mt-2 max-w-[220px]"
          >
            {blockedHint || 'Start AI generation with the settings in this panel.'}
          </Text>
          {error ? (
            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-2 max-w-[220px]"
            >
              {error}
            </Text>
          ) : null}
          <Button
            type="button"
            variant="primary"
            loading={isGenerating}
            loadingText="Generating..."
            disabled={
              checkPending || checkFlagged || checkFailed || !inputsReady
            }
            onClick={handleGenerate}
            className="mt-5 h-[44px] w-full rounded-full px-7"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} />
              {previewUrl ? 'Regenerate' : 'Generate'}
              {creditCost != null ? (
                <span className="text-white/75">{`· ${creditCost} credits`}</span>
              ) : null}
            </span>
          </Button>
          {planHint ? (
            <Text
              as="p"
              variant="caption"
              color="faint"
              caseMode="sentence"
              className="mt-4 max-w-[220px]"
            >
              {planHint}
            </Text>
          ) : null}
        </div>
      </div>

      <input
        ref={referenceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null
          setReferenceFile(file)
          queueCheck(file)
          event.target.value = ''
        }}
      />
      <input
        ref={placeInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null
          setPlaceFile(file)
          if (!file) setRenovationFile(null)
          queueCheck(file)
          event.target.value = ''
        }}
      />
      <input
        ref={renovationInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null
          setRenovationFile(file)
          queueCheck(file)
          event.target.value = ''
        }}
      />

      <ImagePreviewModal
        open={previewModal.open}
        onClose={() => setPreviewModal({ open: false, src: '', alt: '', title: '' })}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />
    </section>
  )
}
