'use client'

import { Lock } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Input from '@/components/shared/input/Input'
import { useTranslate } from '@/utils/translate/translate'

const SECTION_TITLE_LABEL_CLASS =
  'text-lg font-semibold text-white md:text-xl'

const SUB_BLOCK_LABEL_CLASS = 'text-base font-medium text-white'

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
            <div>
              <Text variant="section-title" color="white" className="mb-2">
                Output format
              </Text>

              <div className="grid gap-2">
                {outputFormats.map((format) => {
                  const isLocked = !isFormatAllowed(format.id)
                  const isActive = outputFormat === format.id

                  return (
                    <button
                      key={format.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setOutputFormat(format.id)}
                      className={`group/option relative flex w-full items-center justify-between rounded-xl border px-3 py-2 pr-9 ${
                        isActive
                          ? 'border-primary/50 bg-primary/20'
                          : 'border-white/10'
                      } ${
                        isLocked
                          ? 'cursor-not-allowed bg-white/[0.015] text-white/45'
                          : 'text-white'
                      }`}
                    >
                      <Text as="span" variant="caption" caseMode="title">
                        {format.label}
                      </Text>
                      {isLocked ? <LockedHint text={lockedText} /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {showPhotoQuality ? (
            <div>
              <Text variant="section-title" color="white" className="mb-2">
                {photoQualityLabel}
              </Text>

              <div className="grid gap-2">
                {photoQualities.map((quality) => {
                  const isLocked = !isQualityAllowed(quality.id)
                  const isActive = photoQuality === quality.id

                  return (
                    <button
                      key={quality.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setPhotoQuality(quality.id)}
                      className={`group/option relative flex w-full items-center justify-between rounded-xl border px-3 py-2 pr-9 ${
                        isActive
                          ? 'border-primary/50 bg-primary/20'
                          : 'border-white/10'
                      } ${
                        isLocked
                          ? 'cursor-not-allowed bg-white/[0.015] text-white/45'
                          : 'text-white'
                      }`}
                    >
                      <Text as="span" variant="caption" caseMode="title">
                        {quality.label}
                      </Text>
                      {isLocked ? <LockedHint text={lockedText} /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showModelPreset && modelPresets.length ? (
        <div className={showPrompt || showOutputFormat || showPhotoQuality ? 'mt-4' : ''}>
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
                  <Text as="span" variant="sub-block-label" color="white" caseMode="title">
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