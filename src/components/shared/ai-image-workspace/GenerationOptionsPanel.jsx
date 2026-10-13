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
  promptLabel = 'Additional prompt',
  promptPlaceholder = 'Add small details, mood, colors, or background...',
  photoQualityLabel = 'Photo quality',
}) {
  const columns =
    showOutputFormat && showPhotoQuality ? 'md:grid-cols-2' : 'md:grid-cols-1'

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
    </div>
  )
}
