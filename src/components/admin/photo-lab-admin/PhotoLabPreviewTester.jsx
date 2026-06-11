'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Text from '@/components/shared/text/Text'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import {
  createPhotoLabTemplate,
  generatePhotoLabAdminPreview,
} from '@/store/photo-lab/photo-lab-operations'
import { PROTOTYPE_MAP } from '@/constants/prototype-source-map'
import {
  DEFAULT_PHOTO_QUALITY,
  PHOTO_QUALITIES,
  getPhotoQuality,
} from '@/constants/photo-quality'
import {
  CLIENT_MODEL_PRESET_IDS,
  CLIENT_MODEL_PRESET_META,
  DEFAULT_MODEL_PRESET,
} from '@/constants/model-presets'
import {
  DEFAULT_RESTORE_STYLE,
  RESTORE_COLORIZE_MODE,
  RESTORE_STYLE_IDS,
  getRestoreStyleMeta,
} from '@/constants/restore-styles'
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Eraser,
  ImagePlus,
  Loader2,
  Paintbrush,
  Sparkles,
  WandSparkles,
} from 'lucide-react'

const ENHANCE_QUALITY_MODE = 'enhance_quality'

const MODEL_PRESETS = CLIENT_MODEL_PRESET_IDS.map((id) => ({
  id,
  label: CLIENT_MODEL_PRESET_META[id].label,
  description: CLIENT_MODEL_PRESET_META[id].description,
}))

const RESTORE_STYLES = RESTORE_STYLE_IDS.map((id) => ({
  id,
  label: getRestoreStyleMeta(id).label,
  description: getRestoreStyleMeta(id).description,
}))

const PHOTO_LAB_TEST_MODES = [
  {
    id: 'professional_portrait',
    title: 'Professional Portrait',
    label: 'LinkedIn / CV',
    icon: BriefcaseBusiness,
  },
  {
    id: 'restore_colorize',
    title: 'Restore & Colorize',
    label: 'Old photo',
    icon: Sparkles,
  },
  {
    id: 'smart_edit',
    title: 'Smart Edit',
    label: 'Prompt edit',
    icon: WandSparkles,
  },
  {
    id: 'remove_objects',
    title: 'Remove Objects',
    label: 'Cleanup',
    icon: Eraser,
  },
  {
    id: 'enhance_quality',
    title: 'Enhance Quality',
    label: 'Upscale / sharpen',
    icon: ImagePlus,
  },
  {
    id: 'creative_retouch',
    title: 'Creative Retouch',
    label: 'Style polish',
    icon: Paintbrush,
  },
]

const RACE_OPTIONS = [
  { value: 'european', label: 'European' },
  { value: 'afro', label: 'Afro' },
  { value: 'arab', label: 'Arabic' },
  { value: 'asian', label: 'Asian' },
]

const PERSON_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
]

const VIEW_OPTIONS = [
  { value: 'front', label: 'Front' },
  { value: '3q', label: '3/4 view' },
]

function getPrototypeGender({ race, gender }) {
  if (race === 'european') return gender
  return `${race}_${gender === 'man' ? 'male' : 'female'}`
}

function makePreviewSourceKey({ race, gender, view }) {
  if (!race || !gender || !view) return ''

  const prototypeGender = getPrototypeGender({ race, gender })

  return `${prototypeGender}_${view}_color`
}

async function srcToFile(src, filename = 'photo-lab-prototype.png') {
  const response = await fetch(src)

  if (!response.ok) {
    throw new Error('Failed to load prototype image')
  }

  const blob = await response.blob()

  return new File([blob], filename, {
    type: blob.type || 'image/png',
  })
}

export default function PhotoLabPreviewTester() {
  const dispatch = useDispatch()
  const mainInputRef = useRef(null)
  const referenceInputRef = useRef(null)

  const [selectedModeId, setSelectedModeId] = useState(
    PHOTO_LAB_TEST_MODES[0].id,
  )
  const [modelPreset, setModelPreset] = useState(DEFAULT_MODEL_PRESET)
  const [restoreStyle, setRestoreStyle] = useState(DEFAULT_RESTORE_STYLE)
  const [photoQuality, setPhotoQuality] = useState(DEFAULT_PHOTO_QUALITY)

  const [race, setRace] = useState('european')
  const [gender, setGender] = useState('man')
  const [view, setView] = useState('front')

  const [mainSourceFile, setMainSourceFile] = useState(null)
  const [referenceSourceFiles, setReferenceSourceFiles] = useState([])
  const [sourceUploadPreviews, setSourceUploadPreviews] = useState([])
  const [activeSourceIndex, setActiveSourceIndex] = useState(0)

  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [resultPreview, setResultPreview] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [templateTitle, setTemplateTitle] = useState('')
  const [error, setError] = useState('')
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  const selectedMode = useMemo(() => {
    return (
      PHOTO_LAB_TEST_MODES.find((mode) => mode.id === selectedModeId) ||
      PHOTO_LAB_TEST_MODES[0]
    )
  }, [selectedModeId])

  const isEnhanceQualityMode = selectedModeId === ENHANCE_QUALITY_MODE
  const isRestoreColorizeMode = selectedModeId === RESTORE_COLORIZE_MODE
  const canUsePrototypeSource = !isEnhanceQualityMode
  const requiresUploadedSource = isEnhanceQualityMode

  const selectedPhotoQuality = useMemo(() => {
    return getPhotoQuality(photoQuality)
  }, [photoQuality])

  const previewSourceKey = useMemo(() => {
    return makePreviewSourceKey({ race, gender, view })
  }, [race, gender, view])

  const prototypeSrc = useMemo(() => {
    return PROTOTYPE_MAP[previewSourceKey] || PROTOTYPE_MAP.man_front_color
  }, [previewSourceKey])

  const activeSourcePreviewItem = useMemo(() => {
    return sourceUploadPreviews[activeSourceIndex] || null
  }, [activeSourceIndex, sourceUploadPreviews])

  const activeSourcePreview =
    activeSourcePreviewItem?.url || (canUsePrototypeSource ? prototypeSrc : '')
  const isUsingUploadedSource = Boolean(mainSourceFile)
  const hasMultipleSourcePhotos =
    !isEnhanceQualityMode && sourceUploadPreviews.length > 1

  useEffect(() => {
    setModelPreset(DEFAULT_MODEL_PRESET)

    if (selectedModeId === ENHANCE_QUALITY_MODE) {
      setReferenceSourceFiles([])

      if (referenceInputRef.current) {
        referenceInputRef.current.value = ''
      }
    }
  }, [selectedModeId])

  useEffect(() => {
    setAdditionalPrompt('')
    setResultPreview('')
    setError('')
  }, [selectedMode])

  useEffect(() => {
    if (!mainSourceFile) {
      setSourceUploadPreviews([])
      setActiveSourceIndex(0)
      return
    }

    const previewItems = isEnhanceQualityMode
      ? [
          {
            type: 'main',
            label: 'Source photo',
            url: URL.createObjectURL(mainSourceFile),
          },
        ]
      : [
          {
            type: 'main',
            label: 'Main photo',
            url: URL.createObjectURL(mainSourceFile),
          },
          ...referenceSourceFiles.map((file, index) => ({
            type: 'reference',
            label: `Reference ${index + 1}`,
            url: URL.createObjectURL(file),
          })),
        ]

    setSourceUploadPreviews(previewItems)
    setActiveSourceIndex(0)

    return () => {
      previewItems.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [isEnhanceQualityMode, mainSourceFile, referenceSourceFiles])

  const resolveSourceFiles = async () => {
    if (isEnhanceQualityMode) {
      if (!mainSourceFile) {
        throw new Error('Upload a source photo before generating')
      }

      return [mainSourceFile]
    }

    if (mainSourceFile) {
      return [mainSourceFile, ...referenceSourceFiles].slice(0, 3)
    }

    const prototypeFile = await srcToFile(
      prototypeSrc,
      `${previewSourceKey || 'prototype'}.png`,
    )

    return [prototypeFile]
  }

  const goToPreviousSourcePhoto = () => {
    setActiveSourceIndex((currentIndex) => {
      if (!sourceUploadPreviews.length) return 0
      return currentIndex === 0
        ? sourceUploadPreviews.length - 1
        : currentIndex - 1
    })
  }

  const goToNextSourcePhoto = () => {
    setActiveSourceIndex((currentIndex) => {
      if (!sourceUploadPreviews.length) return 0
      return currentIndex === sourceUploadPreviews.length - 1
        ? 0
        : currentIndex + 1
    })
  }

  const clearUploadedSources = () => {
    setMainSourceFile(null)
    setReferenceSourceFiles([])
    setResultPreview('')
    setError('')

    if (mainInputRef.current) {
      mainInputRef.current.value = ''
    }

    if (referenceInputRef.current) {
      referenceInputRef.current.value = ''
    }
  }

  const openImagePreview = useCallback(({ src, alt, title }) => {
    if (!src) return

    setPreviewModal({
      open: true,
      src,
      alt,
      title,
    })
  }, [])

  const closeImagePreview = useCallback(() => {
    setPreviewModal({
      open: false,
      src: '',
      alt: '',
      title: '',
    })
  }, [])

  const openSourceImagePreview = useCallback(() => {
    if (!activeSourcePreview) return

    const sourceLabel = activeSourcePreviewItem?.label || 'Prototype source'

    openImagePreview({
      src: activeSourcePreview,
      alt: 'Source preview',
      title: `${selectedMode.title} — ${sourceLabel}`,
    })
  }, [
    activeSourcePreview,
    activeSourcePreviewItem?.label,
    openImagePreview,
    selectedMode.title,
  ])

  const openResultImagePreview = useCallback(() => {
    if (!resultPreview) return

    openImagePreview({
      src: resultPreview,
      alt: 'Generated Photo Lab preview',
      title: `${selectedMode.title} — Generated preview`,
    })
  }, [openImagePreview, resultPreview, selectedMode.title])

  const handleGenerate = async () => {
    const normalizedAdditionalPrompt = String(additionalPrompt || '').trim()

    if (requiresUploadedSource && !mainSourceFile) {
      setError('Upload a source photo before generating')
      return
    }

    setError('')
    setIsGenerating(true)

    try {
      const resolvedSourceFiles = await resolveSourceFiles()

      const formData = new FormData()

      formData.append('mode', selectedMode.id)
      formData.append('modelPreset', modelPreset)
      formData.append('photoQuality', selectedPhotoQuality.id)
      formData.append('additionalPrompt', normalizedAdditionalPrompt)

      if (selectedMode.id === RESTORE_COLORIZE_MODE) {
        formData.append('restoreStyle', restoreStyle)
      }

      resolvedSourceFiles.forEach((file) => {
        formData.append('photos', file)
      })

      const data = await dispatch(
        generatePhotoLabAdminPreview(formData),
      ).unwrap()

      setResultPreview(data?.previewUrl || data?.imageUrl || data?.url || '')
    } catch (e) {
      setError(
        e?.data?.message ||
          e?.message ||
          'Failed to generate Photo Lab preview',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTemplate = async () => {
    const normalizedTitle = String(templateTitle || '').trim()

    if (!resultPreview) {
      setError('Generate preview before saving template')
      return
    }

    if (!normalizedTitle) {
      setError('Template title is required')
      return
    }

    if (!gender) {
      setError('Select man or woman before saving template')
      return
    }

    if (requiresUploadedSource && !mainSourceFile) {
      setError('Upload a source photo before saving template')
      return
    }

    setError('')
    setIsSavingTemplate(true)

    try {
      const resolvedSourceFiles = await resolveSourceFiles()

      const formData = new FormData()

      formData.append('mode', selectedMode.id)
      formData.append('title', normalizedTitle)
      formData.append('subjectGender', gender)
      formData.append('generatedImageUrl', resultPreview)

      resolvedSourceFiles.forEach((file) => {
        formData.append('photos', file)
      })

      await dispatch(createPhotoLabTemplate(formData)).unwrap()

      setTemplateTitle('')
    } catch (e) {
      setError(
        e?.data?.message || e?.message || 'Failed to save Photo Lab template',
      )
    } finally {
      setIsSavingTemplate(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-background-soft/70 p-4 sm:p-5 md:p-6">
      <div className="mb-5">
        <Text as="h3" variant="h3" color="white" caseMode="sentence">
          AI model testing workspace
        </Text>

        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2 max-w-3xl"
        >
          {isEnhanceQualityMode
            ? 'Enhance Quality uses one uploaded source photo. Test model preset and output quality before saving showcase templates.'
            : 'This admin workspace is for testing Photo Lab modes before connecting them to the public page. The first uploaded image is always sent as the primary identity source.'}
        </Text>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Text
              as="p"
              variant="caption"
              color="faint"
              caseMode="sentence"
              className="mb-3 uppercase tracking-[0.18em]"
            >
              Photo Lab mode
            </Text>

            <div className="flex flex-col gap-3">
              {PHOTO_LAB_TEST_MODES.map((mode) => {
                const Icon = mode.icon
                const active = selectedModeId === mode.id

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedModeId(mode.id)}
                    disabled={isGenerating || isSavingTemplate}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-primary/45 bg-primary/15'
                        : 'border-white/10 bg-background-soft/70 hover:border-primary/25'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary-soft">
                      <Icon size={18} />
                    </span>

                    <span>
                      <Text
                        as="span"
                        variant="body-sm"
                        color="white"
                        caseMode="sentence"
                      >
                        {mode.title}
                      </Text>

                      <Text
                        as="span"
                        variant="caption"
                        color="muted"
                        caseMode="sentence"
                        className="mt-0.5 block"
                      >
                        {mode.label}
                      </Text>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Text
              as="p"
              variant="caption"
              color="faint"
              caseMode="sentence"
              className="mb-3 uppercase tracking-[0.18em]"
            >
              Photo likeness
            </Text>

            <div className="flex flex-col gap-3">
              {MODEL_PRESETS.map((preset) => {
                const active = modelPreset === preset.id

                return (
                  <label
                    key={preset.id}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                      active
                        ? 'border-cyan-300/35 bg-cyan-300/10'
                        : 'border-white/10 bg-background-soft/70'
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="modelPreset"
                        value={preset.id}
                        checked={active}
                        onChange={() => setModelPreset(preset.id)}
                        disabled={isGenerating || isSavingTemplate}
                        className="mt-1 h-4 w-4 accent-[var(--primary)]"
                      />

                      <span>
                        <Text
                          as="span"
                          variant="body-sm"
                          color="soft"
                          caseMode="sentence"
                        >
                          {preset.label}
                        </Text>

                        <Text
                          as="span"
                          variant="caption"
                          color="muted"
                          caseMode="sentence"
                          className="mt-1 block"
                        >
                          {preset.description}
                        </Text>
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {isRestoreColorizeMode ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Text
                as="p"
                variant="caption"
                color="faint"
                caseMode="sentence"
                className="mb-3 uppercase tracking-[0.18em]"
              >
                Restore type
              </Text>

              <div className="flex flex-col gap-3">
                {RESTORE_STYLES.map((style) => {
                  const active = restoreStyle === style.id

                  return (
                    <label
                      key={style.id}
                      className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                        active
                          ? 'border-amber-300/35 bg-amber-300/10'
                          : 'border-white/10 bg-background-soft/70'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="restoreStyle"
                          value={style.id}
                          checked={active}
                          onChange={() => setRestoreStyle(style.id)}
                          disabled={isGenerating || isSavingTemplate}
                          className="mt-1 h-4 w-4 accent-[var(--primary)]"
                        />

                        <span>
                          <Text
                            as="span"
                            variant="body-sm"
                            color="soft"
                            caseMode="sentence"
                          >
                            {style.label}
                          </Text>

                          <Text
                            as="span"
                            variant="caption"
                            color="muted"
                            caseMode="sentence"
                            className="mt-1 block"
                          >
                            {style.description}
                          </Text>
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Text
              as="p"
              variant="caption"
              color="faint"
              caseMode="sentence"
              className="mb-3 uppercase tracking-[0.18em]"
            >
              Photo quality
            </Text>

            <div className="flex flex-col gap-3">
              {Object.values(PHOTO_QUALITIES).map((quality) => (
                <label
                  key={quality.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-background-soft/70 px-4 py-3"
                >
                  <input
                    type="radio"
                    name="photo-quality"
                    value={quality.id}
                    checked={photoQuality === quality.id}
                    onChange={() => setPhotoQuality(quality.id)}
                    disabled={isGenerating || isSavingTemplate}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />

                  <Text
                    as="span"
                    variant="caption"
                    color="soft"
                    caseMode="sentence"
                  >
                    {quality.label}
                  </Text>
                </label>
              ))}
            </div>

            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-3"
            >
              Active: {selectedPhotoQuality.label}
            </Text>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Text
                  as="h4"
                  variant="caption"
                  caseMode="sentence"
                  className="text-foreground-soft"
                >
                  {isEnhanceQualityMode ? 'Source photo' : 'Source images'}
                </Text>
              </div>

              <div
                className={`mb-4 grid gap-3 ${isEnhanceQualityMode ? '' : 'sm:grid-cols-2'}`}
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => mainInputRef.current?.click()}
                  disabled={isGenerating || isSavingTemplate}
                  className="w-full"
                >
                  {isEnhanceQualityMode ? 'Upload photo' : 'Upload main photo'}
                </Button>

                {!isEnhanceQualityMode ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => referenceInputRef.current?.click()}
                    disabled={
                      isGenerating || isSavingTemplate || !mainSourceFile
                    }
                    className="w-full"
                  >
                    Upload references
                  </Button>
                ) : null}
              </div>

              {!isUsingUploadedSource && canUsePrototypeSource ? (
                <div className="mb-4 rounded-2xl border border-white/10 bg-background-soft/70 p-4">
                  <Text
                    as="p"
                    variant="caption"
                    color="faint"
                    caseMode="sentence"
                    className="mb-3 uppercase tracking-[0.18em]"
                  >
                    Prototype source
                  </Text>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Text
                        as="p"
                        variant="caption"
                        color="muted"
                        caseMode="sentence"
                        className="mb-2"
                      >
                        Race
                      </Text>

                      <div className="flex flex-col gap-2">
                        {RACE_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                          >
                            <input
                              type="radio"
                              name="photo-lab-race"
                              value={option.value}
                              checked={race === option.value}
                              onChange={() => {
                                setRace(option.value)
                                setResultPreview('')
                                setError('')
                              }}
                              disabled={isGenerating || isSavingTemplate}
                              className="h-4 w-4 accent-[var(--primary)]"
                            />

                            <Text
                              as="span"
                              variant="caption"
                              color="soft"
                              caseMode="sentence"
                            >
                              {option.label}
                            </Text>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Text
                        as="p"
                        variant="caption"
                        color="muted"
                        caseMode="sentence"
                        className="mb-2"
                      >
                        Person
                      </Text>

                      <div className="flex flex-col gap-2">
                        {PERSON_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                          >
                            <input
                              type="radio"
                              name="photo-lab-person"
                              value={option.value}
                              checked={gender === option.value}
                              onChange={() => {
                                setGender(option.value)
                                setResultPreview('')
                                setError('')
                              }}
                              disabled={isGenerating || isSavingTemplate}
                              className="h-4 w-4 accent-[var(--primary)]"
                            />

                            <Text
                              as="span"
                              variant="caption"
                              color="soft"
                              caseMode="sentence"
                            >
                              {option.label}
                            </Text>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Text
                        as="p"
                        variant="caption"
                        color="muted"
                        caseMode="sentence"
                        className="mb-2"
                      >
                        View
                      </Text>

                      <div className="flex flex-col gap-2">
                        {VIEW_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                          >
                            <input
                              type="radio"
                              name="photo-lab-view"
                              value={option.value}
                              checked={view === option.value}
                              onChange={() => {
                                setView(option.value)
                                setResultPreview('')
                                setError('')
                              }}
                              disabled={isGenerating || isSavingTemplate}
                              className="h-4 w-4 accent-[var(--primary)]"
                            />

                            <Text
                              as="span"
                              variant="caption"
                              color="soft"
                              caseMode="sentence"
                            >
                              {option.label}
                            </Text>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Text
                    as="p"
                    variant="caption"
                    color="muted"
                    caseMode="sentence"
                    className="mt-3"
                  >
                    Active prototype: {previewSourceKey}
                  </Text>
                </div>
              ) : isUsingUploadedSource ? (
                <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <Text
                    as="p"
                    variant="body-sm"
                    color="soft"
                    caseMode="sentence"
                  >
                    {isEnhanceQualityMode
                      ? 'This photo will be enhanced and used as the before image when saving a showcase template.'
                      : 'Main photo is sent first and used as the primary identity source. Reference photos are sent after it as supporting identity sources.'}
                  </Text>

                  <Text
                    as="p"
                    variant="caption"
                    color="muted"
                    caseMode="sentence"
                    className="mt-2"
                  >
                    {isEnhanceQualityMode
                      ? `Selected: ${mainSourceFile?.name || 'Not selected'}`
                      : `Main: ${mainSourceFile?.name || 'Not selected'} · References: ${referenceSourceFiles.length} / 2`}
                  </Text>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearUploadedSources}
                    disabled={isGenerating || isSavingTemplate}
                    className="mt-3 w-auto"
                  >
                    {isEnhanceQualityMode ? 'Remove photo' : 'Use prototype instead'}
                  </Button>
                </div>
              ) : null}

              <div className="relative flex min-h-[420px] cursor-zoom-in items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-white/15 bg-background-soft/70 p-2 text-center">
                {activeSourcePreview ? (
                  <>
                    <button
                      type="button"
                      onClick={openSourceImagePreview}
                      aria-label="Open source preview"
                      className="absolute inset-0 z-[1] cursor-zoom-in"
                    />

                    <img
                      src={activeSourcePreview}
                      alt="Source preview"
                      className="relative z-0 max-h-[520px] w-full rounded-[18px] object-contain"
                    />

                    {activeSourcePreviewItem ? (
                      <span className="pointer-events-none absolute left-4 top-4 z-[2] rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs text-white backdrop-blur">
                        {activeSourcePreviewItem.label}
                      </span>
                    ) : null}

                    {hasMultipleSourcePhotos ? (
                      <>
                        <button
                          type="button"
                          onClick={goToPreviousSourcePhoto}
                          disabled={isGenerating || isSavingTemplate}
                          className="absolute left-4 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur transition hover:border-primary/40 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Previous source photo"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={goToNextSourcePhoto}
                          disabled={isGenerating || isSavingTemplate}
                          className="absolute right-4 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur transition hover:border-primary/40 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Next source photo"
                        >
                          <ChevronRight size={18} />
                        </button>

                        <span className="pointer-events-none absolute bottom-4 left-1/2 z-[2] -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs text-white backdrop-blur">
                          {activeSourceIndex + 1} /{' '}
                          {sourceUploadPreviews.length}
                        </span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <div className="max-w-sm px-4">
                    <Text
                      as="p"
                      variant="body"
                      color="white"
                      caseMode="sentence"
                    >
                      {isEnhanceQualityMode
                        ? 'Upload a source photo'
                        : 'Upload main source photo'}
                    </Text>

                    <Text
                      as="p"
                      variant="body-sm"
                      color="muted"
                      caseMode="sentence"
                      className="mt-2"
                    >
                      {isEnhanceQualityMode
                        ? 'Upload one low-quality, blurry, compressed, or dark photo to test enhancement.'
                        : 'The main photo will always be sent first. You can add up to two supporting reference photos after it.'}
                    </Text>
                  </div>
                )}
              </div>

              <input
                ref={mainInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = Array.from(e.target.files || [])[0] || null
                  setMainSourceFile(file)
                  setReferenceSourceFiles([])
                  setResultPreview('')
                  setError('')

                  if (referenceInputRef.current) {
                    referenceInputRef.current.value = ''
                  }
                }}
              />

              <input
                ref={referenceInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 2)
                  setReferenceSourceFiles(files)
                  setResultPreview('')
                  setError('')
                }}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Text
                  as="h4"
                  variant="caption"
                  caseMode="sentence"
                  className="text-foreground-soft"
                >
                  Generated preview
                </Text>

                {resultPreview ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary-soft">
                    Ready
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-white/15 bg-background-soft/70 p-2 text-center">
                {isGenerating ? (
                  <div>
                    <Loader2 className="mx-auto mb-4 animate-spin text-primary-soft" />
                    <Text
                      as="p"
                      variant="body"
                      color="white"
                      caseMode="sentence"
                    >
                      Generating preview...
                    </Text>
                  </div>
                ) : resultPreview ? (
                  <div className="relative flex w-full cursor-zoom-in items-center justify-center">
                    <button
                      type="button"
                      onClick={openResultImagePreview}
                      aria-label="Open generated preview"
                      className="absolute inset-0 z-[1] cursor-zoom-in"
                    />

                    <img
                      src={resultPreview}
                      alt="Generated Photo Lab preview"
                      className="relative z-0 max-h-[520px] w-full rounded-[18px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="max-w-sm px-4">
                    <Text
                      as="p"
                      variant="body"
                      color="white"
                      caseMode="sentence"
                    >
                      No result yet
                    </Text>

                    <Text
                      as="p"
                      variant="body-sm"
                      color="muted"
                      caseMode="sentence"
                      className="mt-2"
                    >
                      Upload a source image, adjust settings, and run a test
                      generation.
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Input
              id="photo-lab-additional-prompt"
              as="textarea"
              rows={5}
              label="Additional prompt"
              placeholder={
                isEnhanceQualityMode
                  ? 'Optional: sharpen details, improve lighting, reduce noise, preserve face identity...'
                  : 'Optional details for this test: outfit, background, mood, lighting, objects to add/remove...'
              }
              hint="Optional. This will be combined with the server-side Photo Lab prompt."
              caseMode="sentence"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              disabled={isGenerating || isSavingTemplate}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                id="photo-lab-template-title"
                label="Template title"
                placeholder="Professional LinkedIn portrait"
                caseMode="sentence"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                disabled={isGenerating || isSavingTemplate}
              />

              <div>
                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                  className="mb-2"
                >
                  Showcase subject
                </Text>

                <div className="flex flex-col gap-2">
                  {PERSON_OPTIONS.map((option) => (
                    <label
                      key={`template-${option.value}`}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      <input
                        type="radio"
                        name="photo-lab-template-subject"
                        value={option.value}
                        checked={gender === option.value}
                        onChange={() => setGender(option.value)}
                        disabled={isGenerating || isSavingTemplate}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />

                      <Text
                        as="span"
                        variant="caption"
                        color="soft"
                        caseMode="sentence"
                      >
                        {option.label}
                      </Text>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-background-soft/70 p-4 sm:grid-cols-2">
              <div>
                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                >
                  Mode
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="white"
                  caseMode="sentence"
                  className="mt-1"
                >
                  {selectedMode.title}
                </Text>
              </div>

              <div>
                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                >
                  Subject
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="white"
                  caseMode="sentence"
                  className="mt-1"
                >
                  {PERSON_OPTIONS.find((item) => item.value === gender)?.label ||
                    'Not selected'}
                </Text>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={
                  isGenerating ||
                  isSavingTemplate ||
                  (requiresUploadedSource && !mainSourceFile)
                }
                fullWidth
                className="w-auto"
              >
                {resultPreview
                  ? 'Regenerate test preview'
                  : 'Generate test preview'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveTemplate}
                loading={isSavingTemplate}
                disabled={isGenerating || isSavingTemplate || !resultPreview}
                fullWidth
                className="w-auto"
              >
                Save as template
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setResultPreview('')
                  setError('')
                }}
                disabled={isGenerating || isSavingTemplate || !resultPreview}
                fullWidth
                className="w-auto"
              >
                Clear result
              </Button>
            </div>

            {error ? (
              <div className="mt-3 min-h-5 text-xs leading-5 text-danger">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closeImagePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />
    </div>
  )
}
