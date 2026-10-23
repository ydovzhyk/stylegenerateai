'use client'

import { useMemo } from 'react'
import clsx from 'clsx'
import { Lock } from 'lucide-react'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'

const SECTION_TITLE_LABEL_CLASS =
  'text-lg font-semibold text-white md:text-xl'

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
        <div className={clsx('grid grid-cols-1 gap-4', showPrompt && 'mt-4')}>
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
