'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import clsx from 'clsx'
import { ImagePlus, Loader2, Maximize2 } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import Photo from '@/components/shared/photo/Photo'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import CompactAudioPlayer from '@/components/shared/compact-audio-player/CompactAudioPlayer'
import InfoHint from '@/components/shared/info-hint/InfoHint'
import { PHOTO_OVERLAY_TEXT_OUTLINE } from '@/components/shared/preview-badge/PreviewBadge'
import {
  PhotoStackDetailCards,
  PhotoStackNavButtons,
  usePhotoStackCarousel,
} from '@/components/shared/photo-stack-carousel/PhotoStackCarouselControls'
import {
  ANIMATE_MODES,
  DEFAULT_ANIMATE_ASPECT_RATIO,
  DEFAULT_ANIMATE_DURATION,
  DEFAULT_ANIMATE_MODEL,
  DEFAULT_ANIMATE_RESOLUTION,
  MAX_PROMPT_REFS,
  getAnimateAspectRatiosFromConfig,
  getAnimateDefaultsFromConfig,
  getAnimateDurationsForModel,
  getAnimateModelsFromConfig,
  getAnimateResolutionsForModel,
} from '@/constants/animate'
import {
  USER_PROMPT_TEXTAREA_INPUT_CLASSNAME,
  USER_PROMPT_TEXTAREA_ROWS,
} from '@/constants/user-prompt'
import {
  axiosCreateAnimateTemplate,
  axiosGenerateAnimateVideo,
  axiosGetAnimateSettings,
  axiosGetAnimateTemplates,
  axiosUpdateAnimateSettings,
} from '@/services/api/animate'
import useAnimateGenerationConfig from '@/hooks/useAnimateGenerationConfig'
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

const PREVIEW_FRAME_CLASS =
  'group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[22px] border bg-background-soft/70'

async function dataUrlToFile(dataUrl, filename = 'animate-result.mp4') {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], filename, {
    type: blob.type || 'video/mp4',
  })
}

function revokePreviewUrls(urls = []) {
  urls.forEach((url) => {
    if (url) URL.revokeObjectURL(url)
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

export default function AnimatePreviewTester() {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)
  const photoInputRef = useRef(null)
  const referencesInputRef = useRef(null)
  const musicInputRef = useRef(null)
  const { config, provider, providerLabel, reload, applyConfig } =
    useAnimateGenerationConfig()

  const [selectedModeId, setSelectedModeId] = useState(ANIMATE_MODES[0].id)
  const [prompt, setPrompt] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [model, setModel] = useState(DEFAULT_ANIMATE_MODEL)
  const [duration, setDuration] = useState(String(DEFAULT_ANIMATE_DURATION))
  const [resolution, setResolution] = useState(DEFAULT_ANIMATE_RESOLUTION)
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ANIMATE_ASPECT_RATIO)
  const [syncedProvider, setSyncedProvider] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [referenceFiles, setReferenceFiles] = useState([])
  const [referencePreviews, setReferencePreviews] = useState([])
  const [musicFile, setMusicFile] = useState(null)
  const [musicStartSeconds, setMusicStartSeconds] = useState('0')
  const [imageChecks, setImageChecks] = useState({})
  const [resultPreview, setResultPreview] = useState('')
  const [resultMeta, setResultMeta] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [isSavingProvider, setIsSavingProvider] = useState(false)
  const [providerOptions, setProviderOptions] = useState([
    { id: 'kling', label: 'Kling' },
    { id: 'minimax', label: 'MiniMax' },
  ])
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState('')
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  const selectedMode =
    ANIMATE_MODES.find((mode) => mode.id === selectedModeId) || ANIMATE_MODES[0]
  const isPromptRefs = selectedMode.id === 'prompt_refs'
  const busy = isGenerating || isSavingTemplate || isSavingProvider

  const photoUrl = useObjectUrl(photoFile)
  const musicUrl = useObjectUrl(musicFile)
  const mainReferencePreview = referencePreviews[0] || ''
  const extraReferencePreviews = useMemo(
    () => referencePreviews.slice(1, MAX_PROMPT_REFS),
    [referencePreviews],
  )
  const referenceStackCarousel = usePhotoStackCarousel({
    mainSrc: mainReferencePreview,
    extraSrcs: extraReferencePreviews,
    resetKey: `${selectedModeId}|${mainReferencePreview}|${referencePreviews.length}`,
  })

  useEffect(() => {
    return () => {
      revokePreviewUrls(referencePreviews)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, [])

  useEffect(() => {
    let cancelled = false
    axiosGetAnimateSettings()
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data?.providers) && data.providers.length) {
          setProviderOptions(data.providers)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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

  const modelOptions = useMemo(
    () =>
      getAnimateModelsFromConfig(config).map((item) => ({
        value: item.id,
        label: item.label,
      })),
    [config],
  )
  const durationOptions = useMemo(
    () => getAnimateDurationsForModel(model, config),
    [config, model],
  )
  const resolutionOptions = useMemo(
    () =>
      getAnimateResolutionsForModel(model, config).map((item) => ({
        value: item.id,
        label: item.label,
      })),
    [config, model],
  )
  const aspectRatioOptions = useMemo(
    () =>
      getAnimateAspectRatiosFromConfig(config).map((item) => ({
        value: item.id,
        label: item.label,
      })),
    [config],
  )

  useEffect(() => {
    if (!config?.models?.length || !config?.provider) return

    const defaults = getAnimateDefaultsFromConfig(config)
    const providerChanged = syncedProvider !== config.provider

    if (providerChanged) {
      setSyncedProvider(config.provider)
      setModel(defaults.model)
      setDuration(String(defaults.duration))
      setResolution(defaults.resolution)
      setAspectRatio(defaults.aspectRatio)
      return
    }

    const models = getAnimateModelsFromConfig(config)
    const modelValid = models.some((item) => item.id === model)
    const nextModel = modelValid ? model : defaults.model
    if (!modelValid) setModel(defaults.model)

    const nextDurations = getAnimateDurationsForModel(nextModel, config)
    if (!nextDurations.some((item) => item.value === duration)) {
      setDuration(String(defaults.duration))
    }

    const nextResolutions = getAnimateResolutionsForModel(nextModel, config)
    if (!nextResolutions.some((item) => item.id === resolution)) {
      setResolution(
        nextResolutions[0]?.id || defaults.resolution || DEFAULT_ANIMATE_RESOLUTION,
      )
    }

    const nextAspects = getAnimateAspectRatiosFromConfig(config)
    if (!nextAspects.some((item) => item.id === aspectRatio)) {
      setAspectRatio(defaults.aspectRatio)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.provider, config?.models?.[0]?.id, config?.models?.length])

  const handleProviderChange = async (nextProvider) => {
    if (!nextProvider || nextProvider === provider || isSavingProvider) return
    setIsSavingProvider(true)
    setError('')
    try {
      const data = await axiosUpdateAnimateSettings({ provider: nextProvider })
      if (data?.config) applyConfig(data.config)
      else await reload()
    } catch (err) {
      setError(String(err?.message || 'Failed to update Animate provider'))
    } finally {
      setIsSavingProvider(false)
    }
  }

  useEffect(() => {
    if (!resolutionOptions.length) return
    if (resolutionOptions.some((item) => item.value === resolution)) return
    setResolution(resolutionOptions[0].value)
  }, [resolution, resolutionOptions])

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

  const openImagePreview = ({ src, alt, title }) => {
    const nextSrc = String(src || '').trim()
    if (!nextSrc) return
    setPreviewModal({
      open: true,
      src: nextSrc,
      alt: alt || 'Reference photo',
      title: title || 'Reference photo',
    })
  }

  const closeImagePreview = () => {
    setPreviewModal({ open: false, src: '', alt: '', title: '' })
  }

  const clearReferencePhotos = () => {
    setReferenceFiles([])
    setReferencePreviews((prev) => {
      revokePreviewUrls(prev)
      return []
    })
    setResultPreview('')
    setResultMeta(null)
    setError('')
    if (referencesInputRef.current) {
      referencesInputRef.current.value = ''
    }
  }

  const handleReferencesChange = async (event) => {
    const picked = Array.from(event.target.files || [])
    event.target.value = ''
    if (!picked.length) return

    const room = Math.max(0, MAX_PROMPT_REFS - referenceFiles.length)
    const accepted = picked.slice(0, room)
    if (!accepted.length) return

    setReferenceFiles((prev) => [...prev, ...accepted])
    setReferencePreviews((prev) => [
      ...prev,
      ...accepted.map((file) => URL.createObjectURL(file)),
    ])
    setResultPreview('')
    setResultMeta(null)
    setError('')
    await Promise.all(accepted.map((file) => runPhotoCheck(file)))
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
              Video provider
            </Text>
            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-1"
            >
              Active: {providerLabel}. Public Animate uses this provider and its
              option set (model / resolution / duration).
            </Text>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {providerOptions.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="secondary"
                  shape="soft"
                  active={provider === item.id}
                  disabled={busy}
                  loading={isSavingProvider && provider !== item.id}
                  onClick={() => handleProviderChange(item.id)}
                  className="h-10 min-h-10 justify-center px-4 font-medium"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

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
                    setReferencePreviews((prev) => {
                      revokePreviewUrls(prev)
                      return []
                    })
                    setResultPreview('')
                    setResultMeta(null)
                    setPrompt('')
                    setAspectRatio(DEFAULT_ANIMATE_ASPECT_RATIO)
                    setError('')
                    setPreviewModal({
                      open: false,
                      src: '',
                      alt: '',
                      title: '',
                    })
                  }}
                  className="h-10 min-h-10 justify-start px-4 text-left font-medium"
                >
                  {mode.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                id="admin-animate-model"
                label="Video model"
                options={modelOptions}
                value={modelOptions.find((item) => item.value === model) || null}
                onChange={(option) => {
                  if (!option?.value) return
                  const nextModel = option.value
                  setModel(nextModel)
                  const nextResolutions = getAnimateResolutionsForModel(
                    nextModel,
                    config,
                  )
                  setResolution(
                    nextResolutions[0]?.id || DEFAULT_ANIMATE_RESOLUTION,
                  )
                  const nextDurations = getAnimateDurationsForModel(
                    nextModel,
                    config,
                  )
                  if (!nextDurations.some((item) => item.value === duration)) {
                    setDuration(
                      nextDurations[0]?.value ||
                        String(DEFAULT_ANIMATE_DURATION),
                    )
                  }
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
                onChange={(option) => {
                  if (!option?.value) return
                  setResolution(option.value)
                }}
                isDisabled={busy || resolutionOptions.length <= 1}
                isSearchable={false}
                isClearable={false}
                hideHelp
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
            </div>

            {isPromptRefs ? (
              <div className="overflow-visible">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    shape="soft"
                    active={referenceFiles.length > 0}
                    disabled={busy || referenceFiles.length >= MAX_PROMPT_REFS}
                    fullWidth
                    onClick={() => referencesInputRef.current?.click()}
                    className="h-10 min-h-10 justify-start gap-3 px-4 font-medium"
                    leftIcon={
                      <span
                        aria-hidden
                        className={clsx(
                          'h-4 w-4 shrink-0 rounded-full border',
                          referenceFiles.length > 0
                            ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_#12141c]'
                            : 'border-white/40 bg-transparent',
                        )}
                      />
                    }
                  >
                    {referenceFiles.length > 0
                      ? `Reference photos · ${referenceFiles.length}/${MAX_PROMPT_REFS}`
                      : 'Reference photos'}
                  </Button>
                  {referenceFiles.length ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={clearReferencePhotos}
                      className="justify-start"
                    >
                      Clear reference photos
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => photoInputRef.current?.click()}
                disabled={busy}
                fullWidth
                className="h-10 min-h-10"
              >
                {photoFile ? 'Change source photo' : 'Upload source photo'}
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => musicInputRef.current?.click()}
              disabled={busy}
              fullWidth
              className="h-10 min-h-10 w-full justify-start gap-3"
            >
              {musicFile ? musicFile.name : 'Optional music'}
            </Button>
            {musicUrl ? (
              <CompactAudioPlayer src={musicUrl} />
            ) : null}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="admin-animate-music-start"
                  className="text-sm font-medium text-foreground-soft"
                >
                  Music start (seconds)
                </label>
                <InfoHint
                  placement="top"
                  align="end"
                  widthClassName="w-[260px]"
                  label="Music start hint"
                  text="No need to crop the file yourself. Set where the track should begin in the video (0 = from the start). Example: 32 starts at 0:32. The mix then loops or trims to the clip length."
                />
              </div>
              <Input
                id="admin-animate-music-start"
                type="number"
                min="0"
                step="0.1"
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
                inputClassName="!h-10 !min-h-10 !rounded-full !py-0"
                helpClassName="hidden"
              />
            </div>
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
                className="justify-start"
              >
                Clear music
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
            <div className="mt-3">
              {isPromptRefs ? (
                (() => {
                  const {
                    hasExtras,
                    safeStep,
                    displaySrc,
                    stackSrcs,
                    canGoLeft,
                    canGoRight,
                    goLeft,
                    goRight,
                  } = referenceStackCarousel
                  const activeRefIndex = hasExtras ? safeStep : 0
                  const activeRefFile = referenceFiles[activeRefIndex] || null
                  const eyebrow = `Image ${activeRefIndex + 1}`
                  const title =
                    activeRefFile?.name ||
                    `Reference photo ${activeRefIndex + 1}`

                  if (!mainReferencePreview) {
                    return (
                      <div
                        className={clsx(
                          PREVIEW_FRAME_CLASS,
                          'border-dashed border-white/15',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => referencesInputRef.current?.click()}
                          disabled={busy}
                          className="group flex h-full w-full flex-col items-center justify-center p-5 text-center transition hover:bg-white/[0.035] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
                            <ImagePlus size={24} />
                          </span>
                          <Text
                            as="span"
                            variant="body"
                            color="white"
                            caseMode="sentence"
                          >
                            Upload reference photos
                          </Text>
                          <Text
                            as="span"
                            variant="caption"
                            color="muted"
                            caseMode="sentence"
                            className="mt-2 max-w-[240px]"
                          >
                            1–3 photos. Use Image 1, Image 2, Image 3 in the prompt
                            to point at a specific look.
                          </Text>
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div
                      className={clsx(PREVIEW_FRAME_CLASS, 'border-white/10')}
                    >
                      <Photo
                        src={displaySrc}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(max-width: 1024px) 90vw, 420px"
                        className="scale-110 object-[center_18%] opacity-25 blur-2xl"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <Photo
                        src={displaySrc}
                        alt={eyebrow}
                        fill
                        sizes="(max-width: 1024px) 90vw, 420px"
                        className="z-[1] object-[center_18%] transition duration-700 group-hover:scale-[1.018]"
                      />

                      {hasExtras ? (
                        <>
                          <PhotoStackNavButtons
                            canGoLeft={canGoLeft}
                            canGoRight={canGoRight}
                            onLeft={goLeft}
                            onRight={goRight}
                          />
                          <PhotoStackDetailCards stackSrcs={stackSrcs} />
                        </>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          openImagePreview({
                            src: displaySrc,
                            alt: eyebrow,
                            title,
                          })
                        }
                        className="absolute right-3 top-3 z-[3] hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:bg-black/40 hover:text-white group-hover:opacity-100 lg:inline-flex"
                        aria-label="Open image preview"
                      >
                        <Maximize2 size={15} />
                      </button>

                      <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4">
                        <Text
                          as="p"
                          variant="caption"
                          color="soft"
                          caseMode="sentence"
                          className={PHOTO_OVERLAY_TEXT_OUTLINE}
                        >
                          {eyebrow}
                        </Text>
                        <Text
                          as="p"
                          variant="body"
                          color="white"
                          translate={false}
                          className={clsx(
                            'mt-1 line-clamp-1',
                            PHOTO_OVERLAY_TEXT_OUTLINE,
                          )}
                        >
                          {title}
                        </Text>
                        {referenceFiles.length < MAX_PROMPT_REFS ? (
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy}
                              onClick={(event) => {
                                event.stopPropagation()
                                referencesInputRef.current?.click()
                              }}
                              className="h-[38px] rounded-full border-white/10 bg-white/[0.08] px-5 hover:bg-white/[0.12]"
                            >
                              Add photo
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div
                  className={clsx(
                    PREVIEW_FRAME_CLASS,
                    photoUrl
                      ? 'border-white/10'
                      : 'border-dashed border-white/15',
                  )}
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt="Source"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center">
                      <Text
                        as="p"
                        variant="caption"
                        color="muted"
                        caseMode="sentence"
                      >
                        Upload the Instagram photo to animate
                      </Text>
                    </div>
                  )}
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

      <ImagePreviewModal
        open={previewModal.open}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
        onClose={closeImagePreview}
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
