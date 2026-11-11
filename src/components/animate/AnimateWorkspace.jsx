'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import { ImagePlus, Maximize2, Music2, Sparkles } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import Photo from '@/components/shared/photo/Photo'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import CompactAudioPlayer from '@/components/shared/compact-audio-player/CompactAudioPlayer'
import InfoHint from '@/components/shared/info-hint/InfoHint'
import { PHOTO_OVERLAY_TEXT_OUTLINE } from '@/components/shared/preview-badge/PreviewBadge'
import GenerationActionCard from '@/components/shared/ai-image-workspace/GenerationActionCard'
import GenerationSaveCard from '@/components/shared/ai-image-workspace/GenerationSaveCard'
import {
  PhotoStackDetailCards,
  PhotoStackNavButtons,
  usePhotoStackCarousel,
} from '@/components/shared/photo-stack-carousel/PhotoStackCarouselControls'
import {
  USER_PROMPT_EDITOR_CLASSNAME,
  USER_PROMPT_INPUT_GROUP_CLASSNAME,
  USER_PROMPT_TEXTAREA_INPUT_CLASSNAME,
  USER_PROMPT_TEXTAREA_ROWS,
  WORKSPACE_PREP_BODY_CLASSNAME,
  WORKSPACE_PREP_FRAME_CLASSNAME,
  WORKSPACE_PREP_OPTIONS_ATTR,
  WORKSPACE_PREP_OPTIONS_CLASSNAME,
  WORKSPACE_PREP_PROMPT_ATTR,
  WORKSPACE_PREP_SETTINGS_CLASSNAME,
} from '@/constants/user-prompt'
import {
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
import { axiosGenerateAnimateVideo } from '@/services/api/animate'
import useAnimateGenerationConfig from '@/hooks/useAnimateGenerationConfig'
import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import { createGeneratedImage } from '@/store/generated-image/generated-image-operations'
import {
  PHOTO_CHECK_FAILED_MESSAGE,
  PHOTO_CHECK_PENDING_MESSAGE,
  PHOTO_FLAGGED_MESSAGE,
  imageCheckKey,
  moderateUploadedImage,
} from '@/utils/moderation/moderate-image'

const PREVIEW_FRAME_CLASS =
  'group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[26px] border bg-background-soft/70 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:aspect-[5/6] lg:aspect-[4/5]'

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

export default function AnimateWorkspace({ mode }) {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)
  const photoInputRef = useRef(null)
  const referencesInputRef = useRef(null)
  const musicInputRef = useRef(null)
  const { config } = useAnimateGenerationConfig()

  const isPromptRefs = mode?.id === 'prompt_refs'

  const [photoFile, setPhotoFile] = useState(null)
  const [referenceFiles, setReferenceFiles] = useState([])
  const [referencePreviews, setReferencePreviews] = useState([])
  const [musicFile, setMusicFile] = useState(null)
  const [musicStartSeconds, setMusicStartSeconds] = useState('0')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(DEFAULT_ANIMATE_MODEL)
  const [duration, setDuration] = useState(String(DEFAULT_ANIMATE_DURATION))
  const [resolution, setResolution] = useState(DEFAULT_ANIMATE_RESOLUTION)
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ANIMATE_ASPECT_RATIO)
  const [syncedProvider, setSyncedProvider] = useState('')
  const [imageChecks, setImageChecks] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultPreview, setResultPreview] = useState('')
  const [resultMeta, setResultMeta] = useState(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [saveToGallery, setSaveToGallery] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

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
    resetKey: `${mode?.id || 'animate'}|${mainReferencePreview}|${referencePreviews.length}`,
  })

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
    // Re-sync whenever admin switches provider / catalog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.provider, config?.models?.[0]?.id, config?.models?.length])

  useEffect(() => {
    if (!resolutionOptions.length) return
    if (resolutionOptions.some((item) => item.value === resolution)) return
    setResolution(resolutionOptions[0].value)
  }, [resolution, resolutionOptions])

  useEffect(() => {
    if (!durationOptions.length) return
    if (durationOptions.some((item) => item.value === duration)) return
    setDuration(durationOptions[0].value)
  }, [duration, durationOptions])

  const aspectRatioOptions = useMemo(
    () =>
      getAnimateAspectRatiosFromConfig(config).map((item) => ({
        value: item.id,
        label: item.label,
      })),
    [config],
  )

  useEffect(() => {
    const defaults = getAnimateDefaultsFromConfig(config)
    setPhotoFile(null)
    setReferenceFiles([])
    setReferencePreviews((prev) => {
      revokePreviewUrls(prev)
      return []
    })
    setMusicFile(null)
    setMusicStartSeconds('0')
    setPrompt('')
    setAspectRatio(defaults.aspectRatio)
    setResolution(defaults.resolution)
    setResultPreview('')
    setResultMeta(null)
    setVideoTitle('')
    setSaveToGallery(false)
    setSaveLoading(false)
    setImageChecks({})
    setPreviewModal({ open: false, src: '', alt: '', title: '' })
    // Only reset workspace inputs when the Animate mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode?.id])

  useEffect(() => {
    return () => {
      revokePreviewUrls(referencePreviews)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, [])

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
    if (referencesInputRef.current) {
      referencesInputRef.current.value = ''
    }
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    setPhotoFile(file)
    setResultPreview('')
    setResultMeta(null)
    if (file) await runPhotoCheck(file)
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

    await Promise.all(accepted.map((file) => runPhotoCheck(file)))
  }

  const handleMusicChange = (event) => {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    setMusicFile(file)
    setMusicStartSeconds('0')
  }

  const clearMusic = () => {
    setMusicFile(null)
    setMusicStartSeconds('0')
  }

  const photoStatus = photoFile ? imageChecks[imageCheckKey(photoFile)] : null
  const referenceStatuses = referenceFiles.map(
    (file) => imageChecks[imageCheckKey(file)] || 'pending',
  )
  const referencesReady =
    referenceFiles.length > 0 &&
    referenceStatuses.every((status) => status === 'clear')
  const referencesPending = referenceStatuses.some((status) => status === 'pending')
  const referencesFlagged = referenceStatuses.some((status) => status === 'flagged')
  const referencesError = referenceStatuses.some((status) => status === 'error')

  const promptOk = !mode?.promptRequired || Boolean(prompt.trim())

  const canGenerate = isPromptRefs
    ? Boolean(mode?.id) &&
      promptOk &&
      referencesReady &&
      !isGenerating
    : Boolean(mode?.id) &&
      Boolean(photoFile) &&
      photoStatus === 'clear' &&
      !isGenerating

  const downloadFromBlob = (blob, title, extension = 'mp4') => {
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${title}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  const handleDownloadVideo = async () => {
    if (!resultPreview || saveLoading) return

    const normalizedTitle =
      String(videoTitle || '').trim() ||
      (mode?.title ? `${mode.title} clip` : 'animate-clip')

    setSaveLoading(true)
    try {
      let blob = null

      try {
        const response = await fetch(resultPreview)
        if (!response.ok) {
          throw new Error(`Failed to download video (${response.status})`)
        }
        blob = await response.blob()
        if (!blob?.size) {
          throw new Error('Video file is empty')
        }
      } catch (fetchError) {
        if (isLogin && saveToGallery) {
          throw fetchError
        }
        // Cross-origin storage may block fetch; fall back to direct link.
        const link = document.createElement('a')
        link.href = resultPreview
        link.download = `${normalizedTitle}.mp4`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Video downloaded')
        return
      }

      if (isLogin && saveToGallery) {
        const formData = new FormData()
        formData.append('title', normalizedTitle)
        formData.append('sourceType', 'animate_video')
        formData.append('fileFormat', 'mp4')
        formData.append('saveToGallery', 'true')
        formData.append(
          'image',
          new File([blob], `${normalizedTitle}.mp4`, {
            type: blob.type || 'video/mp4',
          }),
        )
        await dispatch(createGeneratedImage(formData)).unwrap()
      }

      downloadFromBlob(blob, normalizedTitle, 'mp4')
      toast.success(
        isLogin && saveToGallery
          ? 'Video saved to gallery and downloaded'
          : 'Video downloaded',
      )
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          'Failed to download video',
      )
    } finally {
      setSaveLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!mode?.id) {
      toast.info('Choose a mode first')
      return
    }

    if (isPromptRefs) {
      if (!prompt.trim()) {
        toast.info('Write a prompt describing the video')
        return
      }
      if (!referenceFiles.length) {
        toast.info('Upload 1–3 reference photos first')
        return
      }
      if (referencesPending) {
        toast.info(PHOTO_CHECK_PENDING_MESSAGE)
        return
      }
      if (referencesFlagged) {
        toast.error(PHOTO_FLAGGED_MESSAGE)
        return
      }
      if (referencesError) {
        toast.error(PHOTO_CHECK_FAILED_MESSAGE)
        return
      }
    } else {
      if (!photoFile) {
        toast.info('Upload an Instagram photo first')
        return
      }
      if (photoStatus === 'pending') {
        toast.info(PHOTO_CHECK_PENDING_MESSAGE)
        return
      }
      if (photoStatus === 'flagged') {
        toast.error(PHOTO_FLAGGED_MESSAGE)
        return
      }
      if (photoStatus === 'error') {
        toast.error(PHOTO_CHECK_FAILED_MESSAGE)
        return
      }
    }

    const formData = new FormData()
    formData.append('modeId', mode.id)
    formData.append('prompt', prompt)
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

    setIsGenerating(true)
    try {
      const data = await axiosGenerateAnimateVideo(formData)
      const preview =
        data?.previewUrl ||
        (data?.mimeType?.startsWith('video/') && data?.previewUrl) ||
        ''

      if (!preview) {
        throw new Error('Video was generated, but preview is missing')
      }

      setResultPreview(preview)
      setVideoTitle((current) => {
        if (String(current || '').trim()) return current
        return mode?.title ? `${mode.title} clip` : 'Animate clip'
      })
      setResultMeta({
        durationSeconds: data?.durationSeconds,
        model: data?.model,
        resolution: data?.resolution,
        aspectRatio: data?.aspectRatio,
        musicAttached: data?.musicAttached,
        musicMuxed: data?.musicMuxed,
        musicMuxError: data?.musicMuxError,
        promptUsed: data?.promptUsed,
      })
      dispatch(getGenerationUsage())
      if (data?.musicAttached && data?.musicMuxError) {
        toast.warn(
          data?.message ||
            'Video is ready, but music could not be mixed into the file',
        )
      } else {
        toast.success(
          data?.musicMuxed
            ? 'Video is ready with your music'
            : 'Video is ready',
        )
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Video generation failed',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const renderReferenceUploadPreview = () => {
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
      activeRefFile?.name || `Reference photo ${activeRefIndex + 1}`

    if (!mainReferencePreview) {
      return (
        <div
          className={clsx(PREVIEW_FRAME_CLASS, 'border-dashed border-white/15')}
        >
          <button
            type="button"
            onClick={() => referencesInputRef.current?.click()}
            className="group flex h-full w-full flex-col items-center justify-center p-5 text-center transition hover:bg-white/[0.035]"
          >
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
              <ImagePlus size={24} />
            </span>
            <Text as="span" variant="body" color="white" caseMode="sentence">
              Upload reference photos
            </Text>
            <Text
              as="span"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-2 max-w-[240px]"
            >
              1–3 photos. Use Image 1, Image 2, Image 3 in the prompt to point at a
              specific look.
            </Text>
          </button>
        </div>
      )
    }

    return (
      <div className={clsx(PREVIEW_FRAME_CLASS, 'border-white/10')}>
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
            className={clsx('mt-1 line-clamp-1', PHOTO_OVERLAY_TEXT_OUTLINE)}
          >
            {title}
          </Text>
          {referenceFiles.length < MAX_PROMPT_REFS ? (
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isGenerating}
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
  }

  if (!mode) {
    return (
      <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          Animate workspace
        </Text>
        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          Choose a mode above to open the generator.
        </Text>
      </section>
    )
  }

  return (
    <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
      <div className="mb-6">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          {mode.title}
        </Text>
        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          {mode.workspaceHint || mode.description}
        </Text>
      </div>

      <div className="mb-5 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 md:col-span-2 lg:col-span-1">
          <div className={WORKSPACE_PREP_FRAME_CLASSNAME}>
            <div className={WORKSPACE_PREP_BODY_CLASSNAME}>
              <div
                className={clsx(
                  WORKSPACE_PREP_SETTINGS_CLASSNAME,
                  'flex flex-col gap-4',
                )}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    id="animate-model"
                    label="Video model"
                    options={modelOptions}
                    value={
                      modelOptions.find((item) => item.value === model) || null
                    }
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
                      if (
                        !nextDurations.some((item) => item.value === duration)
                      ) {
                        setDuration(
                          nextDurations[0]?.value ||
                            String(DEFAULT_ANIMATE_DURATION),
                        )
                      }
                    }}
                    isDisabled={isGenerating}
                    isSearchable={false}
                    isClearable={false}
                    hideHelp
                  />

                  <Select
                    id="animate-duration"
                    label="Duration"
                    options={durationOptions}
                    value={
                      durationOptions.find((item) => item.value === duration) ||
                      null
                    }
                    onChange={(option) => {
                      if (!option?.value) return
                      setDuration(option.value)
                    }}
                    isDisabled={isGenerating}
                    isSearchable={false}
                    isClearable={false}
                    hideHelp
                  />

                  <Select
                    id="animate-resolution"
                    label="Resolution"
                    options={resolutionOptions}
                    value={
                      resolutionOptions.find(
                        (item) => item.value === resolution,
                      ) || null
                    }
                    onChange={(option) => {
                      if (!option?.value) return
                      setResolution(option.value)
                    }}
                    isDisabled={
                      isGenerating || resolutionOptions.length <= 1
                    }
                    isSearchable={false}
                    isClearable={false}
                    hideHelp
                  />

                  {isPromptRefs ? (
                    <Select
                      id="animate-aspect-ratio"
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
                      isDisabled={isGenerating}
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
                        active={referenceFiles.length > 0}
                        disabled={
                          isGenerating ||
                          referenceFiles.length >= MAX_PROMPT_REFS
                        }
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
                          disabled={isGenerating}
                          onClick={clearReferencePhotos}
                          className="justify-start"
                        >
                          Clear reference photos
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                {...{ [WORKSPACE_PREP_OPTIONS_ATTR]: '' }}
                className={WORKSPACE_PREP_OPTIONS_CLASSNAME}
              >
                <div className="shrink-0 space-y-3">
                  <Text
                    as="p"
                    variant="caption"
                    color="soft"
                    caseMode="sentence"
                  >
                    Optional music
                  </Text>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => musicInputRef.current?.click()}
                    disabled={isGenerating}
                    className="h-10 min-h-10 w-full justify-start gap-3"
                    leftIcon={<Music2 size={16} />}
                  >
                    {musicFile ? musicFile.name : 'Upload music track'}
                  </Button>
                  {musicUrl ? <CompactAudioPlayer src={musicUrl} /> : null}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="animate-music-start"
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
                      id="animate-music-start"
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
                      disabled={isGenerating || !musicFile}
                      inputClassName="!h-10 !min-h-10 !rounded-full !py-0"
                      helpClassName="hidden"
                    />
                  </div>
                  {musicFile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isGenerating}
                      onClick={clearMusic}
                      className="justify-start"
                    >
                      Clear music
                    </Button>
                  ) : null}
                </div>

                <div
                  {...{ [WORKSPACE_PREP_PROMPT_ATTR]: '' }}
                  className={USER_PROMPT_EDITOR_CLASSNAME}
                >
                  <Input
                    as="textarea"
                    rows={USER_PROMPT_TEXTAREA_ROWS}
                    autoGrow
                    fillHeight
                    label={isPromptRefs ? 'Scene prompt' : 'Motion prompt'}
                    labelClassName="text-lg font-semibold text-white md:text-xl shrink-0"
                    placeholder={mode.promptPlaceholder}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    caseMode="sentence"
                    className={USER_PROMPT_INPUT_GROUP_CLASSNAME}
                    inputClassName={USER_PROMPT_TEXTAREA_INPUT_CLASSNAME}
                    helpClassName="hidden"
                    disabled={isGenerating}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {isPromptRefs ? (
            renderReferenceUploadPreview()
          ) : (
            <>
              <div
                className={clsx(
                  PREVIEW_FRAME_CLASS,
                  photoUrl ? 'border-white/10' : 'border-dashed border-white/15',
                )}
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt="Instagram photo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex h-full w-full flex-col items-center justify-center p-5 text-center transition hover:bg-white/[0.035]"
                  >
                    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
                      <ImagePlus size={24} />
                    </span>
                    <Text as="span" variant="body" color="white" caseMode="sentence">
                      Upload Instagram photo
                    </Text>
                    <Text
                      as="span"
                      variant="caption"
                      color="muted"
                      caseMode="sentence"
                      className="mt-2 max-w-[230px]"
                    >
                      JPG, PNG, or WEBP. This becomes the first frame of the video.
                    </Text>
                  </button>
                )}
              </div>
              {photoFile ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Change photo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isGenerating}
                    onClick={() => {
                      setPhotoFile(null)
                      setResultPreview('')
                      setResultMeta(null)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="min-w-0">
          <div
            className={clsx(
              PREVIEW_FRAME_CLASS,
              resultPreview ? 'border-white/10' : 'border-dashed border-white/15',
            )}
          >
            {resultPreview ? (
              <video
                src={resultPreview}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-5 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
                  <Sparkles size={24} />
                </span>
                <Text as="p" variant="body" color="white" caseMode="sentence">
                  Result video
                </Text>
                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                  className="mt-2 max-w-[230px]"
                >
                  Your clip will appear here after generate.
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

      <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-2">
        <GenerationActionCard
          generatedPreview={resultPreview}
          loading={isGenerating}
          disabled={!canGenerate}
          onGenerate={handleGenerate}
          titleReady="Ready to generate video"
          titleDisabled="Almost ready"
          descriptionReady={
            isPromptRefs
              ? 'Build a clip from your prompt and reference photos.'
              : 'Animate your Instagram photo into a short video.'
          }
          descriptionDisabled={
            isPromptRefs
              ? 'Add a prompt and 1–3 clear reference photos to continue.'
              : 'Upload a clear Instagram photo to continue.'
          }
          buttonGenerate="Generate video"
          buttonRegenerate="Regenerate video"
          buttonGenerating="Generating video..."
        />

        <GenerationSaveCard
          active={Boolean(resultPreview)}
          onDownload={handleDownloadVideo}
          isLogin={isLogin}
          saveToGallery={saveToGallery}
          setSaveToGallery={setSaveToGallery}
          imageTitle={videoTitle}
          setImageTitle={setVideoTitle}
          saveLoading={saveLoading}
          showFileFormat={false}
          showGallerySave
          titleLabel="Video title"
          titlePlaceholder="My animated clip"
          titleInputId="animate-video-title"
          gallerySaveHint="The video will be saved to your gallery before downloading."
          buttonDownload="Download video"
        />
      </div>

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closeImagePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />
    </section>
  )
}
