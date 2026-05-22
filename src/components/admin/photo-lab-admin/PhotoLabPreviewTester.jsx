'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Text from '@/components/shared/text/Text'
import {
  DEFAULT_PHOTO_QUALITY,
  PHOTO_QUALITIES,
  getPhotoQuality,
} from '@/constants/photo-quality'
import {
  BriefcaseBusiness,
  Eraser,
  ImagePlus,
  Loader2,
  Sparkles,
  WandSparkles,
} from 'lucide-react'

const PHOTO_LAB_TEST_MODES = [
  {
    id: 'professional_portrait',
    title: 'Professional Portrait',
    label: 'LinkedIn / CV',
    icon: BriefcaseBusiness,
    defaultPrompt:
      'Create a realistic professional LinkedIn portrait. Keep the same identity and face structure. Improve lighting, outfit, background, and overall studio quality. Natural skin texture, realistic result.',
  },
  {
    id: 'restore_colorize',
    title: 'Restore & Colorize',
    label: 'Old photo',
    icon: Sparkles,
    defaultPrompt:
      'Restore this old photo naturally. Improve details, remove damage and scratches, enhance face clarity, and colorize the image in a realistic way while preserving the original person.',
  },
  {
    id: 'smart_edit',
    title: 'Smart Edit',
    label: 'Prompt edit',
    icon: WandSparkles,
    defaultPrompt:
      'Edit the uploaded photo according to the instruction. Keep the person realistic and recognizable. Make changes natural, clean, and photo-realistic.',
  },
  {
    id: 'remove_objects',
    title: 'Remove Objects',
    label: 'Cleanup',
    icon: Eraser,
    defaultPrompt:
      'Remove unwanted objects and distractions from the photo. Reconstruct the background naturally and keep the image realistic.',
  },
  {
    id: 'enhance_quality',
    title: 'Enhance Quality',
    label: 'Upscale / sharpen',
    icon: ImagePlus,
    defaultPrompt:
      'Improve the photo quality. Enhance sharpness, lighting, contrast, texture, and details naturally without changing the identity.',
  },
]

const MODEL_PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Default testing preset for normal quality and cost.',
  },
  {
    id: 'identity',
    label: 'Identity critical',
    description: 'Use when face likeness is the most important part.',
  },
  {
    id: 'creative',
    label: 'Creative edit',
    description: 'Use for stronger style, scene, outfit, or mood changes.',
  },
]

export default function PhotoLabPreviewTester() {
  const inputRef = useRef(null)

  const [selectedModeId, setSelectedModeId] = useState(
    PHOTO_LAB_TEST_MODES[0].id,
  )
  const [modelPreset, setModelPreset] = useState(MODEL_PRESETS[0].id)
  const [photoQuality, setPhotoQuality] = useState(DEFAULT_PHOTO_QUALITY)
  const [sourceFile, setSourceFile] = useState(null)
  const [sourcePreview, setSourcePreview] = useState('')
  const [prompt, setPrompt] = useState(PHOTO_LAB_TEST_MODES[0].defaultPrompt)
  const [resultPreview, setResultPreview] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const selectedMode = useMemo(() => {
    return (
      PHOTO_LAB_TEST_MODES.find((mode) => mode.id === selectedModeId) ||
      PHOTO_LAB_TEST_MODES[0]
    )
  }, [selectedModeId])

  const selectedPhotoQuality = useMemo(() => {
    return getPhotoQuality(photoQuality)
  }, [photoQuality])

  useEffect(() => {
    setPrompt(selectedMode.defaultPrompt)
    setResultPreview('')
    setError('')
  }, [selectedMode])

  useEffect(() => {
    if (!sourceFile) {
      setSourcePreview('')
      return
    }

    const objectUrl = URL.createObjectURL(sourceFile)
    setSourcePreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [sourceFile])

  const handleGenerate = async () => {
    const normalizedPrompt = String(prompt || '').trim()

    if (!sourceFile) {
      setError('Source image is required')
      return
    }

    if (!normalizedPrompt) {
      setError('Prompt is required')
      return
    }

    setError('')
    setIsGenerating(true)

    try {
      // TODO next step:
      // const formData = new FormData()
      // formData.append('mode', selectedMode.id)
      // formData.append('modelPreset', modelPreset)
      // formData.append('photoQuality', selectedPhotoQuality.id)
      // formData.append('prompt', normalizedPrompt)
      // formData.append('photo', sourceFile)
      // dispatch(generatePhotoLabAdminPreview(formData))

      await new Promise((resolve) => setTimeout(resolve, 900))

      // Temporary UI fallback until backend endpoint is connected.
      setResultPreview(sourcePreview)
    } catch (e) {
      setError(e?.message || 'Failed to generate Photo Lab preview')
    } finally {
      setIsGenerating(false)
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
          This admin workspace is for testing Photo Lab modes before connecting
          them to the public page. Later it will call a dedicated admin test
          endpoint.
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
                    disabled={isGenerating}
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
              Model preset
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
                        disabled={isGenerating}
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
                    disabled={isGenerating}
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
                  Source image
                </Text>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                  disabled={isGenerating}
                  className="w-auto"
                >
                  Upload
                </Button>
              </div>

              <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-white/15 bg-background-soft/70 p-2 text-center">
                {sourcePreview ? (
                  <img
                    src={sourcePreview}
                    alt="Source preview"
                    className="max-h-[520px] w-full rounded-[18px] object-contain"
                  />
                ) : (
                  <div className="max-w-sm px-4">
                    <Text
                      as="p"
                      variant="body"
                      color="white"
                      caseMode="sentence"
                    >
                      Upload source photo
                    </Text>

                    <Text
                      as="p"
                      variant="body-sm"
                      color="muted"
                      caseMode="sentence"
                      className="mt-2"
                    >
                      Use any portrait, old photo, low-quality image, or edit
                      sample for model testing.
                    </Text>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setSourceFile(file)
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
                  <img
                    src={resultPreview}
                    alt="Generated Photo Lab preview"
                    className="max-h-[520px] w-full rounded-[18px] object-contain"
                  />
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
                      Upload a source image, adjust prompt settings, and run a
                      test generation.
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Input
              id="photo-lab-test-prompt"
              as="textarea"
              rows={9}
              label="Test prompt"
              placeholder="Describe what the model should do..."
              hint="This prompt will be sent to the Photo Lab test endpoint later."
              caseMode="sentence"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-background-soft/70 p-4 sm:grid-cols-3">
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
                  Preset
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="white"
                  caseMode="sentence"
                  className="mt-1"
                >
                  {MODEL_PRESETS.find((item) => item.id === modelPreset)?.label}
                </Text>
              </div>

              <div>
                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                >
                  Quality
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="white"
                  caseMode="sentence"
                  className="mt-1"
                >
                  {selectedPhotoQuality.label}
                </Text>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={isGenerating}
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
                onClick={() => {
                  setResultPreview('')
                  setError('')
                }}
                disabled={isGenerating || !resultPreview}
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
    </div>
  )
}
