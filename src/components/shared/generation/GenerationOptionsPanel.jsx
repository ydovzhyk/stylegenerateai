'use client'

import { Lock } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Input from '@/components/shared/input/Input'

function LockedHint({ text }) {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 items-center">
      <Lock size={14} className="text-white/80" />

      <span className="absolute bottom-full right-0 mb-3 w-[240px] rounded-2xl border border-white/15 bg-[#090b14] px-3 py-2 text-center text-xs font-medium leading-5 text-white opacity-0 shadow-2xl shadow-black/40 transition group-hover/option:opacity-100">
        {text}
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

  outputFormats,
  photoQualities,

  isFormatAllowed,
  isQualityAllowed,
  lockedText,

  showPrompt = true,
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.025] p-5">
      {showPrompt ? (
        <Input
          as="textarea"
          rows={3}
          label="Additional prompt"
          placeholder="Add small details, mood, colors, or background..."
          value={extraPrompt}
          onChange={(e) => setExtraPrompt(e.target.value)}
          caseMode="sentence"
          inputClassName="min-h-[92px]"
        />
      ) : null}

      <div
        className={
          showPrompt
            ? 'mt-4 grid gap-4 md:grid-cols-2'
            : 'grid gap-4 md:grid-cols-2'
        }
      >
        <div>
          <Text className="mb-2" variant="caption">
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
                  } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span>{format.label}</span>
                  {isLocked ? <LockedHint text={lockedText} /> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <Text className="mb-2" variant="caption">
            Photo quality
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
                  } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span>{quality.label}</span>
                  {isLocked ? <LockedHint text={lockedText} /> : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
