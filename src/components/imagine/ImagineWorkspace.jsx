'use client'

import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import useGenerationPlanAccess from '@/hooks/useGenerationPlanAccess'
import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import { queueAssistantNotice } from '@/store/assistant/assistant-slice'
import { axiosGenerateImagine } from '@/services/api/imagine'
import {
  PAINTING_TECHNIQUES,
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

function inputsReadyFor(modeId, prompt, placeFile, referenceFile) {
  const promptReady = String(prompt || '').trim().length > 0
  if (modeId === 'wallpaper') return true
  if (modeId === 'tattoo') return promptReady
  if (modeId === 'home') return Boolean(placeFile)
  if (modeId === 'painting') return promptReady || Boolean(referenceFile)
  return false
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
          min="1"
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

function UploadButton({ label, file, onPick, disabled }) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={clsx(
        'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
        file
          ? 'border-primary/35 bg-primary/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/15',
        disabled && 'cursor-not-allowed opacity-55',
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'h-4 w-4 shrink-0 rounded-full border',
          file
            ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_#12141c]'
            : 'border-white/40',
        )}
      />
      <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
        {file ? file.name : label}
      </Text>
    </button>
  )
}

export default function ImagineWorkspace({ mode }) {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)
  const { creditCost, planHint } = useGenerationPlanAccess({
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
  const [technique, setTechnique] = useState('described')
  const [referenceFile, setReferenceFile] = useState(null)
  const [placeFile, setPlaceFile] = useState(null)
  const [renovationFile, setRenovationFile] = useState(null)
  const [imageChecks, setImageChecks] = useState({})
  const [previewUrl, setPreviewUrl] = useState('')
  const [homeStyleLabel, setHomeStyleLabel] = useState('')
  const [wallpaperThemeLabel, setWallpaperThemeLabel] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

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
      const output = data?.output || data?.resultPayload?.output || null
      if (screen?.width && screen?.height) {
        setWallpaperWidth(String(screen.width))
        setWallpaperHeight(String(screen.height))
        setWallpaperScreenLabel(
          screen.device
            ? `${screen.device} · ${screen.width}×${screen.height}`
            : `${screen.width}×${screen.height}`,
        )
      } else if (output?.width && output?.height) {
        setWallpaperScreenLabel(`${output.width}×${output.height}`)
      } else {
        setWallpaperScreenLabel('')
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
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
        <Text as="h2" variant="h3" color="white" caseMode="sentence">
          Describe an idea
        </Text>
        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2"
        >
          Choose a mode above to start.
        </Text>
      </section>
    )
  }

  const inputsReady = inputsReadyFor(mode.id, prompt, placeFile, referenceFile)
  const creditLabel =
    creditCost == null ? 'Generate' : `Generate · ${creditCost} credits`
  const missingHint = inputsReady
    ? ''
    : mode.id === 'home'
      ? 'Upload a photo of your place to generate.'
      : mode.id === 'painting'
        ? 'Write a prompt or add a photo to generate.'
        : 'Write a prompt to generate.'

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div>
          <Text as="p" variant="caption" color="faint" caseMode="sentence">
            {mode.label}
          </Text>
          <Text as="h2" variant="h3" color="white" caseMode="sentence" className="mt-1">
            {mode.title}
          </Text>
        </div>

        {mode.id === 'wallpaper' ? (
          <div className="rounded-2xl border border-white/10 bg-background-soft/70 p-4">
            <Text as="p" variant="caption" color="faint" caseMode="sentence" className="mb-3">
              Screen size
            </Text>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {WALLPAPER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setWallpaperWidth(String(preset.width))
                    setWallpaperHeight(String(preset.height))
                  }}
                  className={clsx(
                    'rounded-2xl border px-4 py-3 text-left',
                    wallpaperWidth === String(preset.width) &&
                      wallpaperHeight === String(preset.height)
                      ? 'border-primary/35 bg-primary/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/15',
                  )}
                >
                  <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
                    {preset.label}
                  </Text>
                </button>
              ))}
            </div>
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
            <Text as="p" variant="caption" color="faint" caseMode="sentence" className="mt-3">
              Leave both sizes at 0. A device in the prompt sets the screen. With no device, the wallpaper is 1920×1080.
            </Text>
          </div>
        ) : null}

        {mode.id === 'tattoo' ? (
          <div className="rounded-2xl border border-white/10 bg-background-soft/70 p-4">
            <Text as="p" variant="caption" color="faint" caseMode="sentence" className="mb-3">
              Print size
            </Text>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {TATTOO_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setTattooStyle(style.id)}
                  className={clsx(
                    'rounded-2xl border px-4 py-3 text-left',
                    tattooStyle === style.id
                      ? 'border-primary/35 bg-primary/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/15',
                  )}
                >
                  <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
                    {style.label}
                  </Text>
                </button>
              ))}
            </div>
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
          <div className="rounded-2xl border border-white/10 bg-background-soft/70 p-4">
            <Text as="p" variant="caption" color="faint" caseMode="sentence" className="mb-3">
              Technique
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {PAINTING_TECHNIQUES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTechnique(item.id)}
                  className={clsx(
                    'rounded-2xl border px-4 py-3 text-left',
                    technique === item.id
                      ? 'border-primary/35 bg-primary/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/15',
                  )}
                >
                  <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
                    {item.label}
                  </Text>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {mode.id === 'home' ? (
          <div className="grid grid-cols-1 gap-2">
            <UploadButton
              label="Your place"
              file={placeFile}
              disabled={isGenerating}
              onPick={() => placeInputRef.current?.click()}
            />
            <UploadButton
              label="Renovation idea"
              file={renovationFile}
              disabled={isGenerating || !placeFile}
              onPick={() => renovationInputRef.current?.click()}
            />
            <input
              ref={placeInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setPlaceFile(file)
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
          </div>
        ) : (
          <div>
            <UploadButton
              label="Reference photo"
              file={referenceFile}
              disabled={isGenerating}
              onPick={() => referenceInputRef.current?.click()}
            />
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
          </div>
        )}

        <label className="flex flex-col gap-2" htmlFor="imagine-prompt">
          <Text as="span" variant="caption" color="faint" caseMode="sentence">
            {mode.id === 'home' || mode.id === 'wallpaper'
              ? 'Optional prompt'
              : 'Prompt'}
          </Text>
          <textarea
            id="imagine-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={mode.promptPlaceholder}
            rows={5}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />
        </label>

        {error ? (
          <Text as="p" variant="caption" color="muted" caseMode="sentence">
            {error}
          </Text>
        ) : null}

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            checkPending ||
            checkFlagged ||
            checkFailed ||
            !inputsReady
          }
          fullWidth
        >
          {isGenerating ? 'Generating...' : creditLabel}
        </Button>

        {missingHint ? (
          <Text as="p" variant="caption" color="faint" caseMode="sentence">
            {missingHint}
          </Text>
        ) : null}

        {planHint ? (
          <Text as="p" variant="caption" color="faint" caseMode="sentence">
            {planHint}
          </Text>
        ) : null}
      </div>

      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
        {previewUrl ? (
          <div className="flex w-full flex-col items-center gap-3">
            {homeStyleLabel ? (
              <Text as="p" variant="caption" color="soft" caseMode="sentence">
                {`Style: ${homeStyleLabel}`}
              </Text>
            ) : null}
            {wallpaperThemeLabel ? (
              <Text as="p" variant="caption" color="soft" caseMode="sentence">
                {`Theme: ${wallpaperThemeLabel}`}
              </Text>
            ) : null}
            {wallpaperScreenLabel ? (
              <Text as="p" variant="caption" color="soft" translate={false}>
                {`Screen: ${wallpaperScreenLabel}`}
              </Text>
            ) : null}
            <img
              src={previewUrl}
              alt={`${mode.title} result`}
              className="max-h-[70vh] w-full rounded-2xl object-contain"
            />
          </div>
        ) : (
          <Text as="p" variant="body-sm" color="muted" caseMode="sentence">
            The generated idea will appear here.
          </Text>
        )}
      </div>
    </section>
  )
}
