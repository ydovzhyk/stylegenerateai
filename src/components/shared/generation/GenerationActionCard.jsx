'use client'

import { RotateCcw, Sparkles } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'

export default function GenerationActionCard({
  generatedPreview,
  loading,
  disabled,
  onGenerate,
  planHint,

  titleReady = 'Ready to generate',
  titleAgain = 'Generate again',
  descriptionReady = 'Start AI generation with your uploaded photo.',
  descriptionDisabled = 'Upload your photo first to continue.',
  buttonGenerate = 'Generate',
  buttonRegenerate = 'Regenerate',
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.025] p-5 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
        {generatedPreview ? <RotateCcw size={24} /> : <Sparkles size={24} />}
      </span>

      <Text as="p" variant="body" color="white" caseMode="sentence">
        {generatedPreview ? titleAgain : titleReady}
      </Text>

      <Text
        as="p"
        variant="caption"
        color="muted"
        caseMode="sentence"
        className="mt-2 max-w-[190px]"
      >
        {disabled ? descriptionDisabled : descriptionReady}
      </Text>

      <Button
        type="button"
        variant="primary"
        loading={loading}
        disabled={disabled}
        onClick={onGenerate}
        className="mt-5 h-[44px] w-full rounded-full px-7"
      >
        <span className="inline-flex items-center gap-2">
          {generatedPreview ? <RotateCcw size={16} /> : <Sparkles size={16} />}
          {generatedPreview ? buttonRegenerate : buttonGenerate}
        </span>
      </Button>

      <Text
        as="p"
        variant="caption"
        color="muted"
        caseMode="sentence"
        className="mt-3 max-w-[230px]"
      >
        {planHint}
      </Text>
    </div>
  )
}
