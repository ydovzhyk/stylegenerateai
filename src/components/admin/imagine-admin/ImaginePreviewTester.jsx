'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import { axiosGenerateImagine } from '@/services/api/imagine'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import {
  createImagineTemplate,
  getImagineTemplates,
} from '@/store/imagine/imagine-operations'
import { setImagineError } from '@/store/imagine/imagine-slice'
import {
  IMAGINE_MODES,
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

function ChoiceButton({ active, disabled, onClick, children, translate = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-2xl border px-4 py-3 text-left transition',
        active
          ? 'border-primary/45 bg-primary/15'
          : 'border-white/10 bg-background-soft/70 hover:border-primary/25',
        disabled && 'cursor-not-allowed opacity-55',
      )}
    >
      <Text
        as="span"
        variant="body-sm"
        color="white"
        caseMode="sentence"
        translate={translate}
      >
        {children}
      </Text>
    </button>
  )
}

function SizeField({ id, label, value, suffix, onChange, disabled }) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <Text as="span" variant="caption" color="faint" caseMode="sentence">
        {label}
      </Text>
      <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-background-soft/70 px-4 py-3">
        <input
          id={id}
          type="number"
          min="1"
          inputMode="numeric"
          value={value}
          disabled={disabled}
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

export default function ImaginePreviewTester() {
  const dispatch = useDispatch()
  const referenceInputRef = useRef(null)
  const placeInputRef = useRef(null)
  const renovationInputRef = useRef(null)
  const moderationSerialRef = useRef(new Map())

  const [selectedModeId, setSelectedModeId] = useState(IMAGINE_MODES[0].id)
  const [prompt, setPrompt] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
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
  const [resultPreview, setResultPreview] = useState('')
  const [homeStyleLabel, setHomeStyleLabel] = useState('')
  const [wallpaperThemeLabel, setWallpaperThemeLabel] = useState('')
  const [wallpaperScene, setWallpaperScene] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [error, setError] = useState('')

  const selectedMode =
    IMAGINE_MODES.find((mode) => mode.id === selectedModeId) || IMAGINE_MODES[0]
  const busy = isGenerating || isSavingTemplate
  const userPhoto = selectedMode.id === 'home' ? placeFile : referenceFile

  const userPhotoUrl = useMemo(
    () => (userPhoto ? URL.createObjectURL(userPhoto) : ''),
    [userPhoto],
  )

  useEffect(() => {
    if (!userPhotoUrl) return undefined
    return () => URL.revokeObjectURL(userPhotoUrl)
  }, [userPhotoUrl])

  const uploadedFiles = [referenceFile, placeFile, renovationFile].filter(Boolean)
  const checkState = uploadedFiles.map(
    (file) => imageChecks[imageCheckKey(file)] || 'pending',
  )
  const checkPending = checkState.includes('pending')
  const checkFlagged = checkState.includes('flagged')
  const checkFailed = checkState.includes('error')

  const promptReady = prompt.trim().length > 0
  const canGenerate =
    selectedMode.id === 'wallpaper'
      ? true
      : selectedMode.id === 'home'
        ? Boolean(placeFile)
        : selectedMode.id === 'painting'
          ? promptReady || Boolean(referenceFile)
          : promptReady

  const examplePrompt =
    prompt.trim() ||
    wallpaperScene ||
    (homeStyleLabel ? `Style: ${homeStyleLabel}` : '')

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
        if (result.flagged) setError(PHOTO_FLAGGED_MESSAGE)
      })
      .catch(() => {
        if (moderationSerialRef.current.get(key) !== serial) return
        setImageChecks((prev) => ({ ...prev, [key]: 'error' }))
      })
  }

  const selectMode = (modeId) => {
    setSelectedModeId(modeId)
    setResultPreview('')
    setHomeStyleLabel('')
    setWallpaperThemeLabel('')
    setWallpaperScene('')
    setWallpaperScreenLabel('')
    setError('')
  }

  const handleGenerate = async () => {
    if (checkPending) {
      setError(PHOTO_CHECK_PENDING_MESSAGE)
      return
    }
    if (checkFlagged) {
      setError(PHOTO_FLAGGED_MESSAGE)
      return
    }
    if (checkFailed) {
      setError(PHOTO_CHECK_FAILED_MESSAGE)
      return
    }
    if (!canGenerate) return

    const formData = new FormData()
    formData.append('mode', selectedMode.id)
    formData.append('prompt', prompt.trim())

    if (selectedMode.id === 'wallpaper') {
      formData.append('width', wallpaperWidth)
      formData.append('height', wallpaperHeight)
      if (referenceFile) formData.append('reference', referenceFile)
    }

    if (selectedMode.id === 'tattoo') {
      formData.append('widthCm', tattooWidth)
      formData.append('heightCm', tattooHeight)
      formData.append('tattooStyle', tattooStyle)
      if (referenceFile) formData.append('reference', referenceFile)
    }

    if (selectedMode.id === 'home') {
      if (placeFile) formData.append('place', placeFile)
      if (renovationFile) formData.append('renovation', renovationFile)
    }

    if (selectedMode.id === 'painting') {
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
      setResultPreview(nextPreview)
      setHomeStyleLabel(
        data?.homeStyle?.label || data?.resultPayload?.homeStyle?.label || '',
      )
      setWallpaperThemeLabel(
        data?.wallpaperTheme?.label ||
          data?.resultPayload?.wallpaperTheme?.label ||
          '',
      )
      setWallpaperScene(
        data?.wallpaperScene || data?.resultPayload?.wallpaperScene || '',
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
      const message =
        generateError?.response?.data?.message ||
        generateError?.message ||
        'Failed to generate Imagine preview'
      setError(message)
      dispatch(setImagineError(message))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTemplate = async () => {
    const title = templateTitle.trim()

    if (!resultPreview) {
      setError('Generate preview before saving template')
      return
    }
    if (!title) {
      setError('Template title is required')
      return
    }
    if (!examplePrompt) {
      setError('A prompt example is required')
      return
    }

    setError('')
    setIsSavingTemplate(true)

    try {
      const formData = new FormData()
      formData.append('mode', selectedMode.id)
      formData.append('title', title)
      formData.append('prompt', examplePrompt)
      formData.append('generatedImageUrl', resultPreview)
      if (userPhoto) formData.append('reference', userPhoto)
      if (selectedMode.id === 'home' && renovationFile) {
        formData.append('example', renovationFile)
      }

      await dispatch(createImagineTemplate(formData)).unwrap()
      dispatch(getImagineTemplates())
      setTemplateTitle('')
    } catch (saveError) {
      setError(
        saveError?.data?.message ||
          saveError?.message ||
          'Failed to save Imagine template',
      )
    } finally {
      setIsSavingTemplate(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-background-soft/70 p-4 sm:p-5 md:p-6">
      <div className="mb-5">
        <Text as="h3" variant="h3" color="white" caseMode="sentence">
          Imagine testing workspace
        </Text>
        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2 max-w-3xl"
        >
          Generate a preview, then save it as a showcase template. The public
          preview shows the reference photo on the left, with the prompt in a
          frame. A design example sits on that photo. The result is on the right.
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
              Imagine mode
            </Text>
            <div className="flex flex-col gap-3">
              {IMAGINE_MODES.map((mode) => {
                const Icon = mode.icon
                const active = selectedMode.id === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => selectMode(mode.id)}
                    disabled={busy}
                    className={clsx(
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      active
                        ? 'border-primary/45 bg-primary/15'
                        : 'border-white/10 bg-background-soft/70 hover:border-primary/25',
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary-soft">
                      <Icon size={18} />
                    </span>
                    <span>
                      <Text as="span" variant="body-sm" color="white" caseMode="sentence">
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

          {selectedMode.id === 'wallpaper' ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Text
                as="p"
                variant="caption"
                color="faint"
                caseMode="sentence"
                className="mb-3 uppercase tracking-[0.18em]"
              >
                Screen size
              </Text>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {WALLPAPER_PRESETS.map((preset) => (
                  <ChoiceButton
                    key={preset.id}
                    active={
                      wallpaperWidth === String(preset.width) &&
                      wallpaperHeight === String(preset.height)
                    }
                    disabled={busy}
                    onClick={() => {
                      setWallpaperWidth(String(preset.width))
                      setWallpaperHeight(String(preset.height))
                    }}
                  >
                    {preset.label}
                  </ChoiceButton>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SizeField
                  id="admin-wallpaper-width"
                  label="Width"
                  value={wallpaperWidth}
                  suffix="px"
                  disabled={busy}
                  onChange={setWallpaperWidth}
                />
                <SizeField
                  id="admin-wallpaper-height"
                  label="Height"
                  value={wallpaperHeight}
                  suffix="px"
                  disabled={busy}
                  onChange={setWallpaperHeight}
                />
              </div>
              <Text
                as="p"
                variant="caption"
                color="faint"
                caseMode="sentence"
                className="mt-3"
              >
                Leave both sizes at 0. A reference photo keeps its size and scene. With no photo, a device in the prompt sets the screen, or the wallpaper is 1920×1080.
              </Text>
            </div>
          ) : null}

          {selectedMode.id === 'tattoo' ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Text
                as="p"
                variant="caption"
                color="faint"
                caseMode="sentence"
                className="mb-3 uppercase tracking-[0.18em]"
              >
                Tattoo style
              </Text>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {TATTOO_STYLES.map((style) => (
                  <ChoiceButton
                    key={style.id}
                    active={tattooStyle === style.id}
                    disabled={busy}
                    onClick={() => setTattooStyle(style.id)}
                  >
                    {style.label}
                  </ChoiceButton>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SizeField
                  id="admin-tattoo-width"
                  label="Width"
                  value={tattooWidth}
                  suffix="cm"
                  disabled={busy}
                  onChange={setTattooWidth}
                />
                <SizeField
                  id="admin-tattoo-height"
                  label="Height"
                  value={tattooHeight}
                  suffix="cm"
                  disabled={busy}
                  onChange={setTattooHeight}
                />
              </div>
            </div>
          ) : null}

          {selectedMode.id === 'painting' ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Text
                as="p"
                variant="caption"
                color="faint"
                caseMode="sentence"
                className="mb-3 uppercase tracking-[0.18em]"
              >
                Technique
              </Text>
              <div className="grid grid-cols-2 gap-2">
                {PAINTING_TECHNIQUES.map((item) => (
                  <ChoiceButton
                    key={item.id}
                    active={technique === item.id}
                    disabled={busy}
                    onClick={() => setTechnique(item.id)}
                  >
                    {item.label}
                  </ChoiceButton>
                ))}
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
              {selectedMode.id === 'home' ? 'Photos' : 'Reference photo'}
            </Text>
            {selectedMode.id === 'home' ? (
              <div className="grid gap-2">
                <ChoiceButton
                  active={Boolean(placeFile)}
                  disabled={busy}
                  translate={!placeFile}
                  onClick={() => placeInputRef.current?.click()}
                >
                  {placeFile ? placeFile.name : 'Your place'}
                </ChoiceButton>
                <ChoiceButton
                  active={Boolean(renovationFile)}
                  disabled={busy || !placeFile}
                  translate={!renovationFile}
                  onClick={() => renovationInputRef.current?.click()}
                >
                  {renovationFile ? renovationFile.name : 'Design example'}
                </ChoiceButton>
              </div>
            ) : (
              <ChoiceButton
                active={Boolean(referenceFile)}
                disabled={busy}
                translate={!referenceFile}
                onClick={() => referenceInputRef.current?.click()}
              >
                {referenceFile ? referenceFile.name : 'Optional reference photo'}
              </ChoiceButton>
            )}
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
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-white/15 bg-background-soft/70 p-4 text-center">
            {isGenerating ? (
              <div>
                <Loader2 className="mx-auto mb-4 animate-spin text-primary-soft" />
                <Text as="p" variant="body" color="white" caseMode="sentence">
                  Generating preview...
                </Text>
              </div>
            ) : resultPreview ? (
              <div className="relative w-full max-w-xl">
                {homeStyleLabel ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="soft"
                    caseMode="sentence"
                    className="mb-3"
                  >
                    {`Style: ${homeStyleLabel}`}
                  </Text>
                ) : null}
                {wallpaperThemeLabel ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="soft"
                    caseMode="sentence"
                    className="mb-3"
                  >
                    {`Theme: ${wallpaperThemeLabel}`}
                  </Text>
                ) : null}
                {wallpaperScreenLabel ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="soft"
                    translate={false}
                    className="mb-3"
                  >
                    {`Screen: ${wallpaperScreenLabel}`}
                  </Text>
                ) : null}
                <img
                  src={resultPreview}
                  alt="Generated Imagine preview"
                  className="max-h-[520px] w-full rounded-[18px] object-contain"
                />
                {userPhotoUrl ? (
                  <div className="pointer-events-none absolute bottom-3 right-3 w-[22%] overflow-hidden rounded-2xl border border-white/25 bg-black/40 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                    <div className="relative aspect-[4/5] w-full">
                      <img
                        src={userPhotoUrl}
                        alt="Uploaded photo"
                        className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="max-w-sm px-4">
                <Text as="p" variant="body" color="white" caseMode="sentence">
                  No result yet
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                  className="mt-2"
                >
                  Pick a mode, write the prompt, and run a test generation.
                </Text>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <Input
              id="imagine-preview-prompt"
              as="textarea"
              rows={5}
              label={
                selectedMode.id === 'home' || selectedMode.id === 'wallpaper'
                  ? 'Optional prompt'
                  : 'Prompt'
              }
              placeholder={selectedMode.promptPlaceholder}
              caseMode="sentence"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={busy}
            />

            <div className="mt-4">
              <Input
                id="imagine-template-title"
                label="Template title"
                placeholder="Misty pine forest"
                caseMode="sentence"
                value={templateTitle}
                onChange={(event) => setTemplateTitle(event.target.value)}
                disabled={busy}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-background-soft/70 p-4">
              <Text as="p" variant="caption" color="muted" caseMode="sentence">
                Mode
              </Text>
              <Text as="p" variant="body-sm" color="white" caseMode="sentence" className="mt-1">
                {selectedMode.title}
              </Text>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={busy || checkPending || checkFlagged || checkFailed || !canGenerate}
                fullWidth
                className="w-auto"
              >
                {resultPreview ? 'Regenerate test preview' : 'Generate test preview'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveTemplate}
                loading={isSavingTemplate}
                disabled={busy || !resultPreview}
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
                  setHomeStyleLabel('')
                  setWallpaperThemeLabel('')
                  setWallpaperScene('')
                  setWallpaperScreenLabel('')
                  setError('')
                }}
                disabled={busy || !resultPreview}
                fullWidth
                className="w-auto"
              >
                Clear result
              </Button>
            </div>

            {error ? (
              <div className="mt-3 min-h-5 text-xs leading-5 text-danger">{error}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
