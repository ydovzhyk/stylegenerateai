'use client'

import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Text from '@/components/shared/text/Text'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import { dataUrlToFile } from '@/utils/files/dataUrlToFile'
import { PROTOTYPE_MAP } from '@/constants/prototype-source-map'
import {
  OUTPUT_FORMATS,
  getOutputFormat,
  DEFAULT_OUTPUT_FORMAT,
} from '@/constants/output-formats'
import {
  PHOTO_QUALITIES,
  getPhotoQuality,
  DEFAULT_PHOTO_QUALITY,
} from '@/constants/photo-quality'

const RACE_OPTIONS = [
  { value: 'european', label: 'European' },
  { value: 'afro', label: 'Afro' },
  { value: 'arab', label: 'Arabic' },
  { value: 'asian', label: 'Asian' },
]

const VIEW_OPTIONS = [
  { value: 'front', label: 'Front' },
  { value: 'profile', label: 'Profile' },
  { value: '3q', label: '3/4 view' },
]

function getPrototypeGender({ race, gender }) {
  if (race === 'european') return gender
  return `${race}_${gender === 'man' ? 'male' : 'female'}`
}

function getPrototypeTone({ race, view, tone }) {
  if (tone === 'color') return 'color'
  if (race === 'european' && view !== '3q') return 'bw'
  return 'bw'
}

function makePreviewSourceKey({ race, gender, view, tone, sourceUploadFile }) {
  if (sourceUploadFile) return ''
  if (!race || !gender || !view || !tone) return ''

  const prototypeGender = getPrototypeGender({ race, gender })
  const prototypeTone = getPrototypeTone({ race, view, tone })

  return `${prototypeGender}_${view}_${prototypeTone}`
}

async function srcToFile(src, filename = 'prototype-reference.png') {
  const response = await fetch(src)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

export default function TemplatePreviewGenerator({
  value,
  onApply,
  disabled = false,
  onGenerate,
  resetSignal,
}) {
  const [race, setRace] = useState('european')
  const [gender, setGender] = useState('man')
  const [tone, setTone] = useState('color')
  const [view, setView] = useState('front')
  const [sourceUploadFile, setSourceUploadFile] = useState(null)
  const [sourceUploadPreview, setSourceUploadPreview] = useState('')
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [outputFormat, setOutputFormat] = useState(DEFAULT_OUTPUT_FORMAT)
  const [photoQuality, setPhotoQuality] = useState(DEFAULT_PHOTO_QUALITY)
  const [generatedPreview, setGeneratedPreview] = useState('')
  const [generatedFile, setGeneratedFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [isGeneratedPreviewOpen, setIsGeneratedPreviewOpen] = useState(false)

  const previewSourceKey = useMemo(() => {
    return makePreviewSourceKey({
      race,
      gender,
      view,
      tone,
      sourceUploadFile,
    })
  }, [race, gender, view, tone, sourceUploadFile])

  const prototypeSrc = useMemo(() => {
    return PROTOTYPE_MAP[previewSourceKey] || PROTOTYPE_MAP.man_front_color
  }, [previewSourceKey])

  const activeSourcePreview = useMemo(() => {
    return sourceUploadPreview || prototypeSrc
  }, [prototypeSrc, sourceUploadPreview])

  const selectedOutputFormat = useMemo(() => {
    return getOutputFormat(outputFormat)
  }, [outputFormat])

  const selectedPhotoQuality = useMemo(() => {
    return getPhotoQuality(photoQuality)
  }, [photoQuality])

  const selectedPreviewAspectClass = useMemo(() => {
    return selectedOutputFormat?.previewAspectClass || 'aspect-[4/5]'
  }, [selectedOutputFormat])

  const isUsingUploadedSource = Boolean(sourceUploadFile)

  useEffect(() => {
    if (!sourceUploadFile) {
      setSourceUploadPreview('')
      return
    }

    const objectUrl = URL.createObjectURL(sourceUploadFile)
    setSourceUploadPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [sourceUploadFile])

  useEffect(() => {
    setRace('european')
    setGender('man')
    setTone('color')
    setView('front')
    setSourceUploadFile(null)
    setSourceUploadPreview('')
    setGenerationPrompt('')
    setOutputFormat(DEFAULT_OUTPUT_FORMAT)
    setPhotoQuality(DEFAULT_PHOTO_QUALITY)
    setGeneratedPreview('')
    setGeneratedFile(null)
    setIsGenerating(false)
    setGenerationError('')
    setIsGeneratedPreviewOpen(false)
  }, [resetSignal])

  const handleSourceUpload = (file) => {
    setSourceUploadFile(file || null)
  }

  const resolveSourceFile = async () => {
    if (sourceUploadFile) {
      return sourceUploadFile
    }

    return srcToFile(prototypeSrc, `${previewSourceKey || 'prototype'}.png`)
  }

  const handleGenerate = async () => {
    const prompt = String(generationPrompt || '').trim()

    if (!prompt) {
      setGenerationError('Generation prompt is required')
      return
    }

    setGenerationError('')

    try {
      setIsGenerating(true)

      const sourceFile = await resolveSourceFile()
      const prototypeGender = getPrototypeGender({ race, gender })
      const prototypeTone = getPrototypeTone({ race, view, tone })

      if (typeof onGenerate === 'function') {
        const result = await onGenerate({
          prompt,
          sourceFile,
          sourceMode: sourceUploadFile ? 'upload' : 'prototype',
          prototype: {
            race,
            gender: prototypeGender,
            view,
            tone: prototypeTone,
            src: prototypeSrc,
            previewSourceKey,
          },
          output: selectedOutputFormat,
          photoQuality: selectedPhotoQuality,
        })

        if (result?.previewUrl) {
          setGeneratedPreview(result.previewUrl)
        }

        if (result?.file) {
          setGeneratedFile(result.file)
        } else if (result?.previewUrl?.startsWith('data:')) {
          setGeneratedFile(dataUrlToFile(result.previewUrl))
        } else {
          setGeneratedFile(null)
        }
      } else {
        const fallbackUrl = sourceUploadPreview || prototypeSrc

        setGeneratedPreview(fallbackUrl)

        if (sourceUploadFile) {
          setGeneratedFile(sourceUploadFile)
        } else {
          const prototypeFile = await srcToFile(
            prototypeSrc,
            `${previewSourceKey || 'prototype'}.png`,
          )
          setGeneratedFile(prototypeFile)
        }
      }
    } catch (error) {
      setGenerationError(error?.message || 'Failed to generate preview result')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = async () => {
    if (!generatedPreview && !generatedFile) return

    if (generatedFile) {
      onApply?.({
        previewFile: generatedFile,
        previewUrl: generatedPreview,
        previewSourceKey,
        basePrompt: generationPrompt.trim(),
      })
      return
    }

    const file = await srcToFile(generatedPreview, 'generated-preview.png')

    onApply?.({
      previewFile: file,
      previewUrl: generatedPreview,
      previewSourceKey,
      basePrompt: generationPrompt.trim(),
    })
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-background-soft/70 p-4 sm:p-5 md:p-6">
      <div className="mb-5">
        <Text as="h3" variant="h3" color="white" caseMode="sentence">
          Preview generator
        </Text>

        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2"
        >
          Choose a prototype or upload your own source photo, then generate the
          final preview result directly in the admin panel.
        </Text>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          {!isUsingUploadedSource ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Text
                as="p"
                variant="caption"
                color="faint"
                caseMode="sentence"
                className="mb-3 uppercase tracking-[0.18em]"
              >
                Prototype options
              </Text>

              <div className="flex flex-col gap-3">
                <div>
                  <Text
                    as="p"
                    variant="body-sm"
                    color="soft"
                    caseMode="sentence"
                    className="mb-2"
                  >
                    Race
                  </Text>

                  <div className="flex flex-col gap-2">
                    {RACE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-background-soft/70 px-3 py-3"
                      >
                        <input
                          type="radio"
                          name="race"
                          value={option.value}
                          checked={race === option.value}
                          onChange={() => setRace(option.value)}
                          disabled={disabled || isGenerating}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />

                        <Text
                          as="span"
                          variant="body-sm"
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
                    variant="body-sm"
                    color="soft"
                    caseMode="sentence"
                    className="mb-2"
                  >
                    Person
                  </Text>

                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-background-soft/70 px-3 py-3">
                      <input
                        type="radio"
                        name="gender"
                        value="man"
                        checked={gender === 'man'}
                        onChange={() => setGender('man')}
                        disabled={disabled || isGenerating}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <Text
                        as="span"
                        variant="body-sm"
                        color="soft"
                        caseMode="sentence"
                      >
                        Man
                      </Text>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-background-soft/70 px-3 py-3">
                      <input
                        type="radio"
                        name="gender"
                        value="woman"
                        checked={gender === 'woman'}
                        onChange={() => setGender('woman')}
                        disabled={disabled || isGenerating}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <Text
                        as="span"
                        variant="body-sm"
                        color="soft"
                        caseMode="sentence"
                      >
                        Woman
                      </Text>
                    </label>
                  </div>
                </div>

                <div>
                  <Text
                    as="p"
                    variant="body-sm"
                    color="soft"
                    caseMode="sentence"
                    className="mb-2"
                  >
                    View
                  </Text>

                  <div className="flex flex-col gap-2">
                    {VIEW_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-background-soft/70 px-3 py-3"
                      >
                        <input
                          type="radio"
                          name="view"
                          value={option.value}
                          checked={view === option.value}
                          onChange={() => setView(option.value)}
                          disabled={disabled || isGenerating}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />

                        <Text
                          as="span"
                          variant="body-sm"
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
                    variant="body-sm"
                    color="soft"
                    caseMode="sentence"
                    className="mb-2"
                  >
                    Tone
                  </Text>

                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-background-soft/70 px-3 py-3">
                      <input
                        type="radio"
                        name="tone"
                        value="color"
                        checked={tone === 'color'}
                        onChange={() => setTone('color')}
                        disabled={disabled || isGenerating}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <Text
                        as="span"
                        variant="body-sm"
                        color="soft"
                        caseMode="sentence"
                      >
                        Color
                      </Text>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-background-soft/70 px-3 py-3">
                      <input
                        type="radio"
                        name="tone"
                        value="black"
                        checked={tone === 'black'}
                        onChange={() => setTone('black')}
                        disabled={disabled || isGenerating}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <Text
                        as="span"
                        variant="body-sm"
                        color="soft"
                        caseMode="sentence"
                      >
                        Black & white
                      </Text>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-background-soft p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSourcePreview}
                  alt="Source preview"
                  className={`mx-auto ${selectedPreviewAspectClass} max-h-[380px] w-full rounded-[18px] object-cover`}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <Text as="p" variant="body-sm" color="soft" caseMode="sentence">
                Custom uploaded photo is currently used as the source image.
              </Text>

              <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-background-soft p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSourcePreview}
                  alt="Uploaded source preview"
                  className={`mx-auto ${selectedPreviewAspectClass} max-h-[380px] w-full rounded-[18px] object-cover`}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Input
              id="template-source-upload"
              label="Upload custom source photo"
              type="file"
              accept="image/*"
              hint="Your uploaded photo overrides the selected prototype."
              caseMode="sentence"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                handleSourceUpload(file)
              }}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Input
              id="template-generation-prompt"
              as="textarea"
              rows={10}
              label="Generation prompt"
              placeholder="Ultra-realistic studio portrait, preserve natural skin pores, fine hair strands, cinematic soft light..."
              hint="You can edit the prompt and regenerate until the result looks right."
              caseMode="sentence"
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
            />

            <div className="mt-4">
              <Text
                as="p"
                variant="caption"
                caseMode="sentence"
                className="text-foreground-soft mb-2"
              >
                Output format
              </Text>

              <div className="flex flex-col gap-3">
                {Object.values(OUTPUT_FORMATS).map((format) => (
                  <label
                    key={format.id}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-background-soft/70 px-4 py-3"
                  >
                    <input
                      type="radio"
                      name="output-format"
                      value={format.id}
                      checked={outputFormat === format.id}
                      onChange={() => setOutputFormat(format.id)}
                      disabled={disabled || isGenerating}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />

                    <div className="flex flex-row items-center gap-2">
                      <Text
                        as="span"
                        variant="caption"
                        color="soft"
                        caseMode="sentence"
                      >
                        {format.label}
                      </Text>

                      <Text as="p" variant="caption" color="muted">
                        {format.width} × {format.height}
                      </Text>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Text
                as="p"
                variant="caption"
                caseMode="sentence"
                className="text-foreground-soft mb-2"
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
                      disabled={disabled || isGenerating}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />

                    <div className="flex flex-col">
                      <Text
                        as="span"
                        variant="caption"
                        color="soft"
                        caseMode="sentence"
                      >
                        {quality.label}
                      </Text>

                      {/* <Text
                        as="span"
                        variant="caption"
                        color="muted"
                        caseMode="sentence"
                      >
                        {quality.description}
                      </Text> */}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={disabled || isGenerating}
                fullWidth
                className="w-auto"
              >
                {generatedPreview ? 'Regenerate result' : 'Generate result'}
              </Button>
            </div>

            {generationError && (
              <div className="mt-2 min-h-5 text-xs leading-5 text-danger">
                {generationError || '\u00A0'}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Text
                as="h4"
                variant="caption"
                caseMode="sentence"
                className="text-foreground-soft"
              >
                Generated result
              </Text>

              {generatedPreview ? (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary-soft">
                  Ready to apply
                </span>
              ) : null}
            </div>

            {generatedPreview ? (
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-background-soft p-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratedPreviewOpen(true)}
                  className="block w-full rounded-[18px] focus:outline-none focus:ring-2 focus:ring-primary/60"
                  aria-label="Open generated image in full size"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedPreview}
                    alt="Generated result"
                    className={`mx-auto ${selectedPreviewAspectClass} max-h-[420px] w-full rounded-[18px] object-cover transition hover:opacity-95`}
                  />
                </button>
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-background-soft/70 px-4 text-center">
                <div className="max-w-sm">
                  <Text as="p" variant="body" color="white" caseMode="sentence">
                    No generated result yet
                  </Text>

                  <Text
                    as="p"
                    variant="body-sm"
                    color="muted"
                    caseMode="sentence"
                    className="mt-2"
                  >
                    Choose a prototype or upload a photo, add a prompt, and run
                    generation.
                  </Text>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={handleApply}
                disabled={!generatedPreview || disabled || isGenerating}
                fullWidth
                className="w-auto"
              >
                Apply result
              </Button>
            </div>
          </div>

          {value ? (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <Text as="p" variant="body-sm" color="soft" caseMode="sentence">
                A final preview is already selected. You can still regenerate a
                new one or upload another final image manually below.
              </Text>
            </div>
          ) : null}
        </div>
      </div>

      <ImagePreviewModal
        open={isGeneratedPreviewOpen}
        onClose={() => setIsGeneratedPreviewOpen(false)}
        src={generatedPreview}
        alt="Generated result full size"
        title="Preview"
      />
    </div>
  )
}