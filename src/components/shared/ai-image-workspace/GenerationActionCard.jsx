'use client'

import { RotateCcw, Sparkles } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Select from '@/components/shared/select/Select'
import { Lock } from 'lucide-react'
import { useMemo } from 'react'

const SECTION_TITLE_LABEL_CLASS = 'text-lg font-semibold text-white md:text-xl'

function formatLockedOptionLabel(option) {
  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span>{option.label}</span>
      {option.isLocked ? <Lock size={14} className="shrink-0 opacity-70" /> : null}
    </span>
  )
}

export default function GenerationActionCard({
  generatedPreview,
  loading,
  disabled,
  onGenerate,
  planHint,

  showOutputFormat = false,
  outputFormat,
  setOutputFormat,
  outputFormats = [],
  isFormatAllowed,
  lockedText,

  titleReady = 'Ready to generate',
  descriptionReady = 'Start AI generation with your uploaded photo.',
  descriptionDisabled = 'Upload your photo first to continue.',
  buttonGenerate = 'Generate',
  buttonRegenerate = 'Regenerate',
  buttonGenerating = 'Generating...',
  creditCost = null,
}) {
  const description = disabled ? descriptionDisabled : descriptionReady

  const outputFormatOptions = useMemo(
    () =>
      outputFormats.map((item) => {
        const locked =
          typeof isFormatAllowed === 'function' ? !isFormatAllowed(item.id) : false

        return {
          value: item.id,
          label: item.label,
          isLocked: locked,
          isDisabled: locked,
        }
      }),
    [outputFormats, isFormatAllowed],
  )

  const selectedOutputFormat =
    outputFormatOptions.find((option) => option.value === outputFormat) || null

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.025] p-5 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
        {generatedPreview ? <RotateCcw size={24} /> : <Sparkles size={24} />}
      </span>

      <Text as="p" variant="body" color="white" caseMode="sentence">
        {titleReady}
      </Text>

      <Text
        as="p"
        variant="caption"
        color="muted"
        caseMode="sentence"
        className="mt-2 max-w-[190px]"
      >
        {description}
      </Text>

      {showOutputFormat ? (
        <div className="mt-5 w-full text-left">
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
        </div>
      ) : null}

      <Button
        type="button"
        variant="primary"
        loading={loading}
        loadingText={buttonGenerating}
        disabled={disabled}
        onClick={onGenerate}
        className="mt-5 h-[44px] w-auto rounded-full px-7"
      >
        <span className="inline-flex items-center gap-2">
          {generatedPreview ? <RotateCcw size={16} /> : <Sparkles size={16} />}
          {generatedPreview ? buttonRegenerate : buttonGenerate}
          {creditCost != null ? (
            <span className="text-white/75">· {creditCost} credits</span>
          ) : null}
        </span>
      </Button>

      {planHint ? (
        <Text
          as="p"
          variant="caption"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-[230px]"
        >
          {planHint}
        </Text>
      ) : null}
    </div>
  )
}
