'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import { ImagePlus, Music2, Sparkles } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import GenerationActionCard from '@/components/shared/ai-image-workspace/GenerationActionCard'
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
  ANIMATE_DURATIONS,
  ANIMATE_KLING_MODELS,
  ANIMATE_RESOLUTIONS,
  DEFAULT_ANIMATE_DURATION,
  DEFAULT_ANIMATE_MODEL,
  DEFAULT_ANIMATE_RESOLUTION,
} from '@/constants/animate'
import { axiosGenerateAnimateVideo } from '@/services/api/animate'
import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import {
  PHOTO_CHECK_FAILED_MESSAGE,
  PHOTO_CHECK_PENDING_MESSAGE,
  PHOTO_FLAGGED_MESSAGE,
  imageCheckKey,
  moderateUploadedImage,
} from '@/utils/moderation/moderate-image'

const PREVIEW_FRAME_CLASS =
  'group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[26px] border bg-background-soft/70 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:aspect-[5/6] lg:aspect-[4/5]'

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
  const musicInputRef = useRef(null)

  const [photoFile, setPhotoFile] = useState(null)
  const [musicFile, setMusicFile] = useState(null)
  const [musicStartSeconds, setMusicStartSeconds] = useState('0')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(DEFAULT_ANIMATE_MODEL)
  const [duration, setDuration] = useState(String(DEFAULT_ANIMATE_DURATION))
  const [resolution] = useState(DEFAULT_ANIMATE_RESOLUTION)
  const [imageChecks, setImageChecks] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultPreview, setResultPreview] = useState('')
  const [resultMeta, setResultMeta] = useState(null)

  const photoUrl = useObjectUrl(photoFile)
  const musicUrl = useObjectUrl(musicFile)

  const modelOptions = useMemo(
    () =>
      ANIMATE_KLING_MODELS.map((item) => ({
        value: item.id,
        label: item.label,
      })),
    [],
  )

  const durationOptions = useMemo(
    () =>
      ANIMATE_DURATIONS.map((item) => ({
        value: item.id,
        label: item.label,
      })),
    [],
  )

  const resolutionOptions = useMemo(
    () =>
      ANIMATE_RESOLUTIONS.map((item) => ({
        value: item.id,
        label: item.label,
      })),
    [],
  )

  useEffect(() => {
    setPhotoFile(null)
    setMusicFile(null)
    setMusicStartSeconds('0')
    setPrompt('')
    setResultPreview('')
    setResultMeta(null)
    setImageChecks({})
  }, [mode?.id])

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
    if (file) await runPhotoCheck(file)
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
  const canGenerate =
    Boolean(mode?.id) &&
    Boolean(photoFile) &&
    photoStatus === 'clear' &&
    !isGenerating

  const handleGenerate = async () => {
    if (!mode?.id) {
      toast.info('Choose a mode first')
      return
    }
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

    const formData = new FormData()
    formData.append('modeId', mode.id)
    formData.append('prompt', prompt)
    formData.append('model', model)
    formData.append('duration', String(duration))
    formData.append('resolution', resolution)
    formData.append('photo', photoFile)
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
      setResultMeta({
        durationSeconds: data?.durationSeconds,
        model: data?.model,
        resolution: data?.resolution,
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
                <Select
                  id="animate-model"
                  label="Kling model"
                  options={modelOptions}
                  value={
                    modelOptions.find((item) => item.value === model) || null
                  }
                  onChange={(option) => {
                    if (!option?.value) return
                    setModel(option.value)
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
                  onChange={() => {}}
                  isDisabled
                  isSearchable={false}
                  isClearable={false}
                  hint="Locked to 720p for the first metrics phase."
                />
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
                    onClick={() => musicInputRef.current?.click()}
                    disabled={isGenerating}
                    className="w-full justify-start gap-3"
                    leftIcon={<Music2 size={16} />}
                  >
                    {musicFile ? musicFile.name : 'Upload music track'}
                  </Button>
                  {musicUrl ? (
                    <audio controls src={musicUrl} className="w-full" />
                  ) : null}
                  <Input
                    id="animate-music-start"
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
                    disabled={isGenerating || !musicFile}
                    hint="No need to crop the file yourself. Set where the track should begin in the video (0 = from the start). Example: 32 starts at 0:32. The mix then loops or trims to the clip length."
                  />
                  {musicFile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isGenerating}
                      onClick={clearMusic}
                    >
                      Remove music
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
                    label="Motion prompt"
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
                  Your Kling clip will appear here after generate.
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

      <div className="mt-5">
        <GenerationActionCard
          generatedPreview={resultPreview}
          loading={isGenerating}
          disabled={!canGenerate}
          onGenerate={handleGenerate}
          titleReady="Ready to generate video"
          titleDisabled="Almost ready"
          descriptionReady="Start Kling image-to-video with your Instagram photo."
          descriptionDisabled="Upload a clear Instagram photo to continue."
          buttonGenerate="Generate video"
          buttonRegenerate="Regenerate video"
          buttonGenerating="Generating video..."
        />
      </div>
    </section>
  )
}
