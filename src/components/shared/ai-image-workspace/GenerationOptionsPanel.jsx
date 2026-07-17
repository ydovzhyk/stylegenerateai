'use client'

import { useMemo } from 'react'
import { Lock } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import { useTranslate } from '@/utils/translate/translate'

const SECTION_TITLE_LABEL_CLASS =
  'text-lg font-semibold text-white md:text-xl'

function LockedHint({ text }) {
  const translatedText = useTranslate(text, { caseMode: 'sentence' })

  return (
    <span className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 text-muted">
      <Lock size={14} className="text-muted" />
      <span className="absolute bottom-full right-0 mb-3 w-[210px] rounded-2xl border border-white/10 bg-[#151821] px-3 py-2 text-cyan-300 text-xs leading-relaxed opacity-0 shadow-2xl shadow-black/30 transition-opacity group-hover/option:opacity-100">
        {translatedText}
      </span>
    </span>
  )
}

function buildSelectOptions(items = [], isAllowed) {
  return items.map((item) => {
    const locked = typeof isAllowed === 'function' ? !isAllowed(item.id) : false

    return {
      value: item.id,
      label: item.label,
      isLocked: locked,
      isDisabled: locked,
    }
  })
}

function formatLockedOptionLabel(option) {
  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span>{option.label}</span>
      {option.isLocked ? <Lock size={14} className="shrink-0 opacity-70" /> : null}
    </span>
  )
}

export default function GenerationOptionsPanel({
  extraPrompt,
  setExtraPrompt,

  outputFormat,
  setOutputFormat,
  photoQuality,
  setPhotoQuality,

  outputFormats = [],
  photoQualities = [],

  isFormatAllowed,
  isQualityAllowed,
  lockedText,

  showPrompt = true,
  showOutputFormat = true,
  showPhotoQuality = true,
  showAiModel = false,
  aiModel,
  setAiModel,
  aiModels = [],
  isAiModelAllowed,
  showModelPreset = false,
  modelPreset,
  setModelPreset,
  modelPresets = [],
  isModelPresetAllowed,
  promptLabel = 'Additional prompt',
  promptPlaceholder = 'Add small details, mood, colors, or background...',
  photoQualityLabel = 'Photo quality',
}) {
  const columns =
    showOutputFormat && showPhotoQuality ? 'md:grid-cols-2' : 'md:grid-cols-1'

  const hasUpperSections = showPrompt || showOutputFormat || showPhotoQuality

  const outputFormatOptions = useMemo(
    () => buildSelectOptions(outputFormats, isFormatAllowed),
    [outputFormats, isFormatAllowed],
  )

  const photoQualityOptions = useMemo(
    () => buildSelectOptions(photoQualities, isQualityAllowed),
    [photoQualities, isQualityAllowed],
  )

  const selectedOutputFormat =
    outputFormatOptions.find((option) => option.value === outputFormat) || null

  const selectedPhotoQuality =
    photoQualityOptions.find((option) => option.value === photoQuality) || null

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.025] p-5">
      {showPrompt ? (
        <Input
          as="textarea"
          rows={3}
          label={promptLabel}
          labelClassName={SECTION_TITLE_LABEL_CLASS}
          placeholder={promptPlaceholder}
          value={extraPrompt}
          onChange={(e) => setExtraPrompt(e.target.value)}
          caseMode="sentence"
          inputClassName="min-h-[92px]"
        />
      ) : null}

      {showOutputFormat || showPhotoQuality ? (
        <div
          className={
            showPrompt ? `mt-4 grid gap-4 ${columns}` : `grid gap-4 ${columns}`
          }
        >
          {showOutputFormat ? (
            <Select
              id="generation-output-format"
              label="Output format"
              labelClassName={SECTION_TITLE_LABEL_CLASS}
              options={outputFormatOptions}
              value={selectedOutputFormat}
              onChange={(option) => {
                if (!option?.value || option.isLocked) return
                setOutputFormat?.(option.value)
              }}
              isOptionDisabled={(option) => Boolean(option.isLocked)}
              formatOptionLabel={formatLockedOptionLabel}
              placeholder="Select format"
              hideHelp
              hint={lockedText}
            />
          ) : null}

          {showPhotoQuality ? (
            <Select
              id="generation-export-size"
              label={photoQualityLabel}
              labelClassName={SECTION_TITLE_LABEL_CLASS}
              options={photoQualityOptions}
              value={selectedPhotoQuality}
              onChange={(option) => {
                if (!option?.value || option.isLocked) return
                setPhotoQuality?.(option.value)
              }}
              isOptionDisabled={(option) => Boolean(option.isLocked)}
              formatOptionLabel={formatLockedOptionLabel}
              placeholder="Select export size"
              hideHelp
              hint={lockedText}
            />
          ) : null}
        </div>
      ) : null}

      {showAiModel && aiModels.length ? (
        <div className={hasUpperSections ? 'mt-4' : ''}>
          <Text variant="section-title" color="white" className="mb-2">
            AI model
          </Text>

          <div className="grid gap-2">
            {aiModels.map((model) => {
              const isLocked = !isAiModelAllowed?.(model.id)
              const isActive = aiModel === model.id

              return (
                <button
                  key={model.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setAiModel?.(model.id)}
                  className={`group/option relative flex w-full flex-col items-start rounded-xl border px-3 py-2 pr-9 text-left ${
                    isActive
                      ? 'border-primary/50 bg-primary/20'
                      : 'border-white/10'
                  } ${
                    isLocked
                      ? 'cursor-not-allowed bg-white/[0.015] text-white/45'
                      : 'text-white'
                  }`}
                >
                  <Text
                    as="span"
                    variant="sub-block-label"
                    color="white"
                    caseMode="title"
                  >
                    {model.label}
                  </Text>

                  {model.description ? (
                    <Text
                      as="span"
                      variant="caption"
                      color="muted"
                      caseMode="sentence"
                      className="mt-1.5 text-sm leading-5"
                    >
                      {model.description}
                    </Text>
                  ) : null}

                  {isLocked ? <LockedHint text={lockedText} /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {showModelPreset && modelPresets.length ? (
        <div
          className={
            hasUpperSections || (showAiModel && aiModels.length) ? 'mt-4' : ''
          }
        >
          <Text variant="section-title" color="white" className="mb-2">
            Photo likeness
          </Text>

          <div className="grid gap-2">
            {modelPresets.map((preset) => {
              const isLocked = !isModelPresetAllowed?.(preset.id)
              const isActive = modelPreset === preset.id

              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setModelPreset?.(preset.id)}
                  className={`group/option relative flex w-full flex-col items-start rounded-xl border px-3 py-2 pr-9 text-left ${
                    isActive
                      ? 'border-primary/50 bg-primary/20'
                      : 'border-white/10'
                  } ${
                    isLocked
                      ? 'cursor-not-allowed bg-white/[0.015] text-white/45'
                      : 'text-white'
                  }`}
                >
                  <Text
                    as="span"
                    variant="sub-block-label"
                    color="white"
                    caseMode="title"
                  >
                    {preset.label}
                  </Text>

                  {preset.description ? (
                    <Text
                      as="span"
                      variant="caption"
                      color="muted"
                      caseMode="sentence"
                      className="mt-1.5 text-sm leading-5"
                    >
                      {preset.description}
                    </Text>
                  ) : null}

                  {preset.credits != null && preset.credits > 0 ? (
                    <Text
                      as="span"
                      variant="caption"
                      color="soft"
                      caseMode="sentence"
                      className="mt-1 text-[11px]"
                    >
                      +{preset.credits} credits
                    </Text>
                  ) : null}

                  {isLocked ? <LockedHint text={lockedText} /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
