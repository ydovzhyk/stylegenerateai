'use client'

import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Loader2, X } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import {
  ANIMATE_ASPECT_RATIOS,
  ANIMATE_DURATIONS,
  ANIMATE_KLING_MODELS,
  ANIMATE_MODES,
  ANIMATE_RESOLUTIONS,
  DEFAULT_ANIMATE_ASPECT_RATIO,
  DEFAULT_ANIMATE_DURATION,
  DEFAULT_ANIMATE_MODEL,
  DEFAULT_ANIMATE_RESOLUTION,
  MAX_PROMPT_REFS,
} from '@/constants/animate'
import {
  USER_PROMPT_TEXTAREA_INPUT_CLASSNAME,
  USER_PROMPT_TEXTAREA_ROWS,
} from '@/constants/user-prompt'
import {
  axiosCreateAnimateTemplate,
  axiosGenerateAnimateVideo,
  axiosGetAnimateTemplates,
} from '@/services/api/animate'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import {
  PHOTO_CHECK_FAILED_MESSAGE,
  PHOTO_CHECK_PENDING_MESSAGE,
  PHOTO_FLAGGED_MESSAGE,
  imageCheckKey,
  moderateUploadedImage,
} from '@/utils/moderation/moderate-image'

async function dataUrlToFile(dataUrl, filename = 'animate-result.mp4') {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], filename, {
    type: blob.type || 'video/mp4',
  })
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

function ReferenceThumb({ file, label, onRemove, disabled }) {
  const url = useObjectUrl(file)

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="aspect-[4/5] w-full object-cover" />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/55 px-2 py-1">
        <Text as="span" variant="caption" color="white" caseMode="none">
          {label}
        </Text>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="rounded-full p-1 text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          aria-label={`Remove ${label}`}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

export default function AnimatePreviewTester() {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)
  const photoInputRef = useRef(null)
  const referencesInputRef = useRef(null)
  const musicInputRef = useRef(null)

  const [selectedModeId, setSelectedModeId] = useState(ANIMATE_MODES[0].id)
  const [prompt, setPrompt] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [model, setModel] = useState(DEFAULT_ANIMATE_MODEL)
  const [duration, setDuration] = useState(String(DEFAULT_ANIMATE_DURATION))
  const [resolution] = useState(DEFAULT_ANIMATE_RESOLUTION)
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ANIMATE_ASPECT_RATIO)
  const [photoFile, setPhotoFile] = useState(null)
  const [referenceFiles, setReferenceFiles] = useState([])
  const [musicFile, setMusicFile] = useState(null)
  const [musicStartSeconds, setMusicStartSeconds] = useState('0')
  const [imageChecks, setImageChecks] = useState({})
  const [resultPreview, setResultPreview] = useState('')
  const [resultMeta, setResultMeta] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState('')

  const selectedMode =
    ANIMATE_MODES.find((mode) => mode.id === selectedModeId) || ANIMATE_MODES[0]
  const isPromptRefs = selectedMode.id === 'prompt_refs'
  const busy = isGenerating || isSavingTemplate

  const photoUrl = useObjectUrl(photoFile)
  const musicUrl = useObjectUrl(musicFile)

  useEffect(() => {
    let cancelled = false
    axiosGetAnimateTemplates()
      .then((data) => {
        if (cancelled) return
        const list = data?.templates?.[selectedModeId] || []
        setSavedCount(Array.isArray(list) ? list.length : 0)
      })
      .catch(() => {
        if (!cancelled) setSavedCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [selectedModeId])

  const modelOptions = ANIMATE_KLING_MODELS.map((item) => ({
    value: item.id,
    label: item.label,
  }))
  const durationOptions = ANIMATE_DURATIONS.map((item) => ({
    value: item.id,
    label: item.label,
  }))
  const resolutionOptions = ANIMATE_RESOLUTIONS.map((item) => ({
    value: item.id,
    label: item.label,
  }))
  const aspectRatioOptions = ANIMATE_ASPECT_RATIOS.map((item) => ({
    value: item.id,
    label: item.label,
  }))

  const photoStatus = photoFile
    ? imageChecks[imageCheckKey(photoFile)] || 'pending'
    : null
  const referenceStatuses = referenceFiles.map(
    (file) => imageChecks[imageCheckKey(file)] || 'pending',
  )
  const referencesReady =
    referenceFiles.length > 0 &&
    referenceStatuses.every((status) => status === 'clear')
  const referencesPending = referenceStatuses.some((status) => status === 'pending')
  const referencesFlagged = referenceStatuses.some((status) => status === 'flagged')
  const referencesError = referenceStatuses.some((status) => status === 'error')
  const promptOk = !selectedMode.promptRequired || Boolean(prompt.trim())

  const canGenerate = isPromptRefs
    ? promptOk && referencesReady && !busy
    : Boolean(photoFile) && photoStatus === 'clear' && !busy

  const runPhotoCheck = async (file) => {
    if (!file) return
    const key = imageCheckKey(file)
    setImageChecks((prev) => ({ ...prev, [key]: 'pending' }))
    try {
      const result = await moderateUploadedImage(file)
      setImageChecks((prev) => ({
        ...prev,
        [key]: result.flagged ? 'flagged' : 'clear',
      }))
    } catch {
      setImageChecks((prev) => ({ ...prev, [key]: 'error' }))
    }
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    setPhotoFile(file)
    setResultPreview('')
    setResultMeta(null)
    setError('')
    if (file) await runPhotoCheck(file)
  }

  const handleReferencesChange = async (event) => {
    const picked = Array.from(event.target.files || [])
    event.target.value = ''
    if (!picked.length) return

    setReferenceFiles((prev) => {
      const room = Math.max(0, MAX_PROMPT_REFS - prev.length)
      return [...prev, ...picked.slice(0, room)]
    })
    setResultPreview('')
    setResultMeta(null)
    setError('')
    await Promise.all(picked.slice(0, MAX_PROMPT_REFS).map((file) => runPhotoCheck(file)))
  }

  const handleMusicChange = (event) => {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    setMusicFile(file)
    setMusicStartSeconds('0')
  }

  const handleGenerate = async () => {
    if (isPromptRefs) {
      if (!prompt.trim()) {
        setError('Write a prompt describing the video before generating')
        return
      }
      if (!referenceFiles.length) {
        setError('Upload 1–3 reference photos before generating')
        return
      }
      if (referencesPending) {
        setError(PHOTO_CHECK_PENDING_MESSAGE)
        return
      }
      if (referencesFlagged) {
        setError(PHOTO_FLAGGED_MESSAGE)
        return
      }
      if (referencesError) {
        setError(PHOTO_CHECK_FAILED_MESSAGE)
        return
      }
    } else {
      if (!photoFile) {
        setError('Upload a source photo before generating')
        return
      }
      if (photoStatus === 'pending') {
        setError(PHOTO_CHECK_PENDING_MESSAGE)
        return
      }
      if (photoStatus === 'flagged') {
        setError(PHOTO_FLAGGED_MESSAGE)
        return
      }
      if (photoStatus === 'error') {
        setError(PHOTO_CHECK_FAILED_MESSAGE)
        return
      }
    }

    setError('')
    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('modeId', selectedMode.id)
      formData.append('prompt', prompt.trim())
      formData.append('model', model)
      formData.append('duration', String(duration))
      formData.append('resolution', resolution)
      if (isPromptRefs) {
        formData.append('aspectRatio', aspectRatio)
        referenceFiles.forEach((file) => formData.append('references', file))
      } else {
        formData.append('photo', photoFile)
      }
      if (musicFile) {
        formData.append('music', musicFile)
        formData.append('musicStartSeconds', String(musicStartSeconds || '0'))
      }
      if (!isLogin && visitorId) formData.append('visitorId', visitorId)

      const data = await axiosGenerateAnimateVideo(formData)
      if (!data?.previewUrl) {
        throw new Error('Generation finished without a video preview')
      }

      setResultPreview(data.previewUrl)
      setResultMeta({
        durationSeconds: data.durationSeconds,
        model: data.model,
        resolution: data.resolution,
        aspectRatio: data.aspectRatio,
        musicAttached: data.musicAttached,
        musicMuxed: data.musicMuxed,
        promptUsed: data.promptUsed,
      })
      dispatch(getGenerationUsage())
    } catch (generateError) {
      setError(
        generateError?.response?.data?.message ||
          generateError?.message ||
          'Video generation failed',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTemplate = async () => {
    const title = templateTitle.trim()
    if (!resultPreview) {
      setError('Generate a video before saving the template')
      return
    }
    if (!title) {
      setError('Template title is required')
      return
    }

    setError('')
    setIsSavingTemplate(true)

    try {
      const formData = new FormData()
      formData.append('mode', selectedMode.id)
      formData.append('title', title)
      formData.append('prompt', prompt.trim())
      formData.append('model', resultMeta?.model || model)
      formData.append(
        'durationSeconds',
        String(resultMeta?.durationSeconds || duration),
      )
      formData.append('resolution', resultMeta?.resolution || resolution)
      formData.append(
        'musicAttached',
        resultMeta?.musicAttached || musicFile ? 'true' : 'false',
      )

      if (isPromptRefs) {
        referenceFiles.forEach((file) => formData.append('references', file))
      } else if (photoFile) {
        formData.append('photo', photoFile)
      }

      // Avoid browser fetch of GCS URLs (CORS → "Failed to fetch").
      // Backend downloads/copies the generated video itself.
      if (/^https?:\/\//i.test(String(resultPreview || ''))) {
        formData.append('generatedVideoUrl', resultPreview)
      } else {
        const resultFile = await dataUrlToFile(
          resultPreview,
          `${normalizeFileSlug(title) || 'animate'}-result.mp4`,
        )
        formData.append('result', resultFile)
      }

      await axiosCreateAnimateTemplate(formData)
      const templates = await axiosGetAnimateTemplates()
      const list = templates?.templates?.[selectedMode.id] || []
      setSavedCount(Array.isArray(list) ? list.length : 0)
      setTemplateTitle('')
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          saveError?.message ||
          'Failed to save Animate template',
      )
    } finally {
      setIsSavingTemplate(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-background-soft/70 p-4 sm:p-5 md:p-6">
      <div className="mb-5">
        <Text as="h3" variant="h3" color="white" caseMode="sentence">
          Animate testing workspace
        </Text>
        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2 max-w-3xl"
        >
          Generate a clip, review it, then save it as a showcase
          template. Good results only - every generation costs real money.
        </Text>
        <Text
          as="p"
          variant="caption"
          color="soft"
          caseMode="sentence"
          className="mt-2"
        >
          Saved templates for this mode: {savedCount}
        </Text>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Text as="p" variant="caption" color="soft" caseMode="sentence">
              Mode
            </Text>
            <div className="mt-3 grid gap-2">
              {ANIMATE_MODES.map((mode) => (
                <Button
                  key={mode.id}
                  type="button"
                  variant="secondary"
                  shape="soft"
                  active={selectedModeId === mode.id}
                  disabled={busy}
                  onClick={() => {
                    setSelectedModeId(mode.id)
                    setPhotoFile(null)
                    setReferenceFiles([])
                    setResultPreview('')
                    setResultMeta(null)
                    setPrompt('')
                    setAspectRatio(DEFAULT_ANIMATE_ASPECT_RATIO)
                    setError('')
                  }}
                  className="justify-start px-4 py-3 text-left font-medium"
                >
                  {mode.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
            <Select
              id="admin-animate-model"
              label="Video model"
              options={modelOptions}
              value={modelOptions.find((item) => item.value === model) || null}
              onChange={(option) => {
                if (!option?.value) return
                setModel(option.value)
              }}
              isDisabled={busy}
              isSearchable={false}
              isClearable={false}
              hideHelp
            />

            <Select
              id="admin-animate-duration"
              label="Duration"
              options={durationOptions}
              value={
                durationOptions.find((item) => item.value === duration) || null
              }
              onChange={(option) => {
                if (!option?.value) return
                setDuration(option.value)
              }}
              isDisabled={busy}
              isSearchable={false}
              isClearable={false}
              hideHelp
            />

            <Select
              id="admin-animate-resolution"
              label="Resolution"
              options={resolutionOptions}
              value={
                resolutionOptions.find((item) => item.value === resolution) ||
                null
              }
              onChange={() => {}}
              isDisabled
              isSearchable={false}
              isClearable={false}
              hint="Locked to 720p for metrics"
            />

            {isPromptRefs ? (
              <Select
                id="admin-animate-aspect-ratio"
                label="Aspect ratio"
                options={aspectRatioOptions}
                value={
                  aspectRatioOptions.find(
                    (item) => item.value === aspectRatio,
                  ) || null
                }
                onChange={(option) => {
                  if (!option?.value) return
                  setAspectRatio(option.value)
                }}
                isDisabled={busy}
                isSearchable={false}
                isClearable={false}
                hideHelp
              />
            ) : null}

            {isPromptRefs ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => referencesInputRef.current?.click()}
                  disabled={busy || referenceFiles.length >= MAX_PROMPT_REFS}
                  fullWidth
                >
                  {referenceFiles.length
                    ? `Add reference (${referenceFiles.length}/${MAX_PROMPT_REFS})`
                    : 'Upload reference photos (1–3)'}
                </Button>
                {referenceFiles.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {referenceFiles.map((file, index) => (
                      <ReferenceThumb
                        key={`${imageCheckKey(file)}-${index}`}
                        file={file}
                        label={`@ref_${index + 1}`}
                        disabled={busy}
                        onRemove={() =>
                          setReferenceFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => photoInputRef.current?.click()}
                disabled={busy}
                fullWidth
              >
                {photoFile ? 'Change source photo' : 'Upload source photo'}
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => musicInputRef.current?.click()}
              disabled={busy}
              fullWidth
            >
              {musicFile ? musicFile.name : 'Optional music'}
            </Button>
            {musicUrl ? (
              <audio controls src={musicUrl} className="w-full" />
            ) : null}
            <Input
              id="admin-animate-music-start"
              type="number"
              min="0"
              step="0.1"
              label="Music start (seconds)"
              value={musicStartSeconds}
              onChange={(event) => {
                const next = event.target.value
                if (next === '') {
                  setMusicStartSeconds('')
                  return
                }
                const parsed = Number(next)
                if (!Number.isFinite(parsed) || parsed < 0) return
                setMusicStartSeconds(String(parsed))
              }}
              disabled={busy || !musicFile}
              hint="No need to crop the file yourself. Set where the track should begin in the video (0 = from the start). Example: 32 starts at 0:32. The mix then loops or trims to the clip length."
            />
            {musicFile ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setMusicFile(null)
                  setMusicStartSeconds('0')
                }}
              >
                Remove music
              </Button>
            ) : null}

            <Input
              as="textarea"
              rows={USER_PROMPT_TEXTAREA_ROWS}
              autoGrow
              label={isPromptRefs ? 'Scene prompt' : 'Motion prompt'}
              placeholder={selectedMode.promptPlaceholder}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={busy}
              caseMode="sentence"
              inputClassName={USER_PROMPT_TEXTAREA_INPUT_CLASSNAME}
              helpClassName="hidden"
            />

            <Button
              type="button"
              variant="primary"
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={!canGenerate}
              fullWidth
            >
              Generate video
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <Input
              id="animate-template-title"
              label="Template title"
              placeholder="Example: Soft smile portrait"
              value={templateTitle}
              onChange={(event) => setTemplateTitle(event.target.value)}
              disabled={busy || !resultPreview}
              caseMode="sentence"
            />
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveTemplate}
              loading={isSavingTemplate}
              disabled={busy || !resultPreview}
              fullWidth
            >
              Save as template
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setResultPreview('')
                setResultMeta(null)
                setError('')
              }}
              disabled={busy || !resultPreview}
              fullWidth
            >
              Clear result
            </Button>
            {error ? (
              <div className="min-h-5 text-xs leading-5 text-danger">{error}</div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <Text as="p" variant="caption" color="soft" caseMode="sentence">
              {isPromptRefs ? 'Reference photos' : 'Source photo'}
            </Text>
            <div className="mt-3 aspect-[4/5] overflow-hidden rounded-2xl border border-dashed border-white/15 bg-background-soft/70">
              {isPromptRefs ? (
                referenceFiles.length ? (
                  <div className="grid h-full grid-cols-2 gap-1 p-1 sm:grid-cols-3">
                    {referenceFiles.map((file, index) => (
                      <ReferenceThumb
                        key={`preview-${imageCheckKey(file)}-${index}`}
                        file={file}
                        label={`@ref_${index + 1}`}
                        disabled={busy}
                        onRemove={() =>
                          setReferenceFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center">
                    <Text as="p" variant="caption" color="muted" caseMode="sentence">
                      Upload 1–3 reference photos for look and identity
                    </Text>
                  </div>
                )
              ) : photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Source"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center">
                  <Text as="p" variant="caption" color="muted" caseMode="sentence">
                    Upload the Instagram photo to animate
                  </Text>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <Text as="p" variant="caption" color="soft" caseMode="sentence">
              Result video
            </Text>
            <div className="mt-3 aspect-[4/5] overflow-hidden rounded-2xl border border-dashed border-white/15 bg-background-soft/70">
              {isGenerating ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-soft" />
                  <Text as="p" variant="caption" color="muted" caseMode="sentence">
                    Rendering video...
                  </Text>
                </div>
              ) : resultPreview ? (
                <video
                  src={resultPreview}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center">
                  <Text as="p" variant="caption" color="muted" caseMode="sentence">
                    Generated clip appears here
                  </Text>
                </div>
              )}
            </div>
            {resultMeta ? (
              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-3"
              >
                {[
                  resultMeta.model,
                  resultMeta.resolution,
                  resultMeta.aspectRatio || '',
                  resultMeta.durationSeconds
                    ? `${resultMeta.durationSeconds}s`
                    : '',
                  resultMeta.musicMuxed
                    ? 'music mixed'
                    : resultMeta.musicAttached
                      ? 'music attached'
                      : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoChange}
      />
      <input
        ref={referencesInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleReferencesChange}
      />
      <input
        ref={musicInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/webm"
        className="hidden"
        onChange={handleMusicChange}
      />
    </div>
  )
}

function normalizeFileSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
