'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Loader2 } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import {
  ANIMATE_DURATIONS,
  ANIMATE_KLING_MODELS,
  ANIMATE_MODES,
  ANIMATE_RESOLUTIONS,
  DEFAULT_ANIMATE_DURATION,
  DEFAULT_ANIMATE_MODEL,
  DEFAULT_ANIMATE_RESOLUTION,
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

export default function AnimatePreviewTester() {
  const dispatch = useDispatch()
  const photoInputRef = useRef(null)
  const musicInputRef = useRef(null)

  const [selectedModeId, setSelectedModeId] = useState(ANIMATE_MODES[0].id)
  const [prompt, setPrompt] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [model, setModel] = useState(DEFAULT_ANIMATE_MODEL)
  const [duration, setDuration] = useState(String(DEFAULT_ANIMATE_DURATION))
  const [resolution] = useState(DEFAULT_ANIMATE_RESOLUTION)
  const [photoFile, setPhotoFile] = useState(null)
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
  const busy = isGenerating || isSavingTemplate

  const photoUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : ''),
    [photoFile],
  )
  const musicUrl = useMemo(
    () => (musicFile ? URL.createObjectURL(musicFile) : ''),
    [musicFile],
  )

  useEffect(() => {
    if (!photoUrl) return undefined
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  useEffect(() => {
    if (!musicUrl) return undefined
    return () => URL.revokeObjectURL(musicUrl)
  }, [musicUrl])

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

  const photoStatus = photoFile
    ? imageChecks[imageCheckKey(photoFile)] || 'pending'
    : null
  const canGenerate =
    Boolean(photoFile) && photoStatus === 'clear' && !busy

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

  const handleMusicChange = (event) => {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    setMusicFile(file)
    setMusicStartSeconds('0')
  }

  const handleGenerate = async () => {
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

    setError('')
    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('modeId', selectedMode.id)
      formData.append('prompt', prompt.trim())
      formData.append('model', model)
      formData.append('duration', String(duration))
      formData.append('resolution', resolution)
      formData.append('photo', photoFile)
      if (musicFile) {
        formData.append('music', musicFile)
        formData.append('musicStartSeconds', String(musicStartSeconds || '0'))
      }

      const data = await axiosGenerateAnimateVideo(formData)
      if (!data?.previewUrl) {
        throw new Error('Generation finished without a video preview')
      }

      setResultPreview(data.previewUrl)
      setResultMeta({
        durationSeconds: data.durationSeconds,
        model: data.model,
        resolution: data.resolution,
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
      if (photoFile) formData.append('photo', photoFile)

      const resultFile = await dataUrlToFile(
        resultPreview,
        `${normalizeFileSlug(title) || 'animate'}-result.mp4`,
      )
      formData.append('result', resultFile)

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
          Generate with Kling, review the clip, then save it as a showcase
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
                    setResultPreview('')
                    setResultMeta(null)
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
              label="Kling model"
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

            <Button
              type="button"
              variant="secondary"
              onClick={() => photoInputRef.current?.click()}
              disabled={busy}
              fullWidth
            >
              {photoFile ? 'Change source photo' : 'Upload source photo'}
            </Button>

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
              label="Motion prompt"
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
              Source photo
            </Text>
            <div className="mt-3 aspect-[4/5] overflow-hidden rounded-2xl border border-dashed border-white/15 bg-background-soft/70">
              {photoUrl ? (
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
                    Kling is rendering...
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
