'use client'

import { useMemo } from 'react'
import { Download, Info, Lock, RotateCcw, Sparkles } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import { useTranslate } from '@/utils/translate/translate'

const SUB_BLOCK_LABEL_CLASS = 'text-base font-medium text-white'

function HoverHint({ text, children, className = '' }) {
  const translatedText = useTranslate(text, { caseMode: 'sentence' })

  return (
    <div className={`group/hint relative w-full ${className}`.trim()}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-[210px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#151821] px-3 py-2 text-center text-xs leading-relaxed text-cyan-300 opacity-0 shadow-2xl shadow-black/30 transition-opacity group-hover/hint:opacity-100">
        {translatedText}
      </span>
    </div>
  )
}

function formatFileFormatOption(option) {
  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="flex min-w-0 flex-col text-left">
        <span className="font-medium">{option.label}</span>
        {option.description ? (
          <span className="mt-0.5 text-xs text-white/55">{option.description}</span>
        ) : null}
      </span>
      {option.isLocked ? <Lock size={14} className="shrink-0 opacity-70" /> : null}
    </span>
  )
}

export default function GenerationActionCard({
  generatedPreview,
  loading,
  disabled,
  onGenerate,
  onDownload,
  planHint,

  isLogin = false,
  saveToGallery = false,
  setSaveToGallery,
  imageTitle = '',
  setImageTitle,
  saveLoading = false,

  generatedImageFormat = 'png',
  setGeneratedImageFormat,
  generatedImageFormats = [],
  isGeneratedImageFormatAllowed,
  formatLockedText = 'Upgrade to a paid plan to unlock this file format.',

  titleReady = 'Ready to generate',
  descriptionReady = 'Start AI generation with your uploaded photo.',
  descriptionDisabled = 'Upload your photo first to continue.',
  buttonGenerate = 'Generate',
  buttonRegenerate = 'Regenerate',
  buttonGenerating = 'Generating...',
  buttonDownload = 'Download',
  buttonDownloadProcessing = 'Processing…',
  printExportProcessingHint = "We're preparing your file format. Please wait — this may take a little while.",
  creditCost = null,
  printExportProcessing = false,
  printExportProgress = null,
  downloadDisabled = false,
  isPrintExport = false,
  downloadOptionsTitle = 'Download options',
}) {
  const canDownload = Boolean(generatedPreview)
  const isActionLoading = loading || saveLoading
  const description = disabled ? descriptionDisabled : descriptionReady
  const translatedDownloadLabel = useTranslate(buttonDownload, {
    caseMode: 'sentence',
  })
  const translatedProcessingLabel = useTranslate(buttonDownloadProcessing, {
    caseMode: 'sentence',
  })

  const hasUnlockedFileFormats =
    isLogin &&
    generatedImageFormats.some((format) =>
      isGeneratedImageFormatAllowed
        ? isGeneratedImageFormatAllowed(format.id)
        : format.id === generatedImageFormat,
    )

  const canChooseFileFormat =
    hasUnlockedFileFormats &&
    generatedImageFormats.length > 1 &&
    !isPrintExport

  const fileFormatOptions = useMemo(
    () =>
      generatedImageFormats.map((format) => {
        const locked = isGeneratedImageFormatAllowed
          ? !isGeneratedImageFormatAllowed(format.id)
          : false

        return {
          value: format.id,
          label: format.label,
          description: format.description,
          isLocked: locked,
          isDisabled: locked,
        }
      }),
    [generatedImageFormats, isGeneratedImageFormatAllowed],
  )

  const selectedFileFormat =
    fileFormatOptions.find((option) => option.value === generatedImageFormat) ||
    null

  const hasLockedFileFormats = fileFormatOptions.some((option) => option.isLocked)

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.025] p-5 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
        {generatedPreview ? <RotateCcw size={24} /> : <Sparkles size={24} />}
      </span>

      {!generatedPreview ? (
        <>
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
        </>
      ) : null}

      <Button
        type="button"
        variant="primary"
        loading={loading}
        loadingText={buttonGenerating}
        disabled={disabled || saveLoading}
        onClick={onGenerate}
        className={
          generatedPreview
            ? 'h-[44px] w-full rounded-full px-7'
            : 'mt-5 h-[44px] w-full rounded-full px-7'
        }
      >
        <span className="inline-flex items-center gap-2">
          {generatedPreview ? <RotateCcw size={16} /> : <Sparkles size={16} />}
          {generatedPreview ? buttonRegenerate : buttonGenerate}
          {creditCost != null && !generatedPreview ? (
            <span className="text-white/75">· {creditCost} credits</span>
          ) : null}
          {creditCost != null && generatedPreview ? (
            <span className="text-white/75">· {creditCost} credits</span>
          ) : null}
        </span>
      </Button>

      {canDownload ? (
        <div className="mt-5 w-full rounded-[22px] border border-white/10 bg-white/[0.035] p-4 text-left">
          <Text variant="section-title" color="white" className="mb-2">
            {downloadOptionsTitle}
          </Text>

          <Input
            id="generated-image-title"
            label="Image title"
            labelClassName={SUB_BLOCK_LABEL_CLASS}
            placeholder="My generated look"
            value={imageTitle}
            onChange={(e) => setImageTitle?.(e.target.value)}
            inputClassName="h-[40px]"
          />

          {isLogin ? (
            <div className="mt-[-10px]">
              {canChooseFileFormat ? (
                <div className="mb-4">
                  <Select
                    id="generated-image-format"
                    label="Save file format"
                    labelClassName={SUB_BLOCK_LABEL_CLASS}
                    options={fileFormatOptions}
                    value={selectedFileFormat}
                    onChange={(option) => {
                      if (!option?.value || option.isLocked) return
                      setGeneratedImageFormat?.(option.value)
                    }}
                    isOptionDisabled={(option) => Boolean(option.isLocked)}
                    formatOptionLabel={formatFileFormatOption}
                    placeholder="Select file format"
                    hideHelp={!hasLockedFileFormats}
                    hint={hasLockedFileFormats ? formatLockedText : undefined}
                    menuPlacement="top"
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    id="save-generated-image"
                    type="checkbox"
                    checked={saveToGallery}
                    onChange={(e) => setSaveToGallery?.(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />

                  <label
                    htmlFor="save-generated-image"
                    className="cursor-pointer"
                  >
                    <Text
                      as="span"
                      variant="sub-block-label"
                      color="white"
                      caseMode="sentence"
                    >
                      Save to gallery
                    </Text>
                  </label>
                </div>

                <span className="cursor-pointer group relative flex text-muted transition-colors hover:text-cyan-300">
                  <Info size={14} />

                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-[210px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#151821] px-3 py-2 text-center text-xs leading-relaxed text-muted opacity-0 shadow-2xl shadow-black/30 transition-opacity group-hover:opacity-100">
                    The image will be saved before downloading.
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-4"
            >
              Sign in to save this image to your gallery.
            </Text>
          )}

          {printExportProcessing ? (
            <HoverHint text={printExportProcessingHint}>
              <Button
                type="button"
                variant="secondary"
                disabled
                translate={false}
                className="mt-5 h-[44px] w-full rounded-full px-7"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{translatedProcessingLabel}</span>
                  <span className="tabular-nums">
                    {Math.max(0, printExportProgress ?? 0)}%
                  </span>
                </span>
              </Button>
            </HoverHint>
          ) : (
            <Button
              type="button"
              variant="secondary"
              loading={saveLoading}
              disabled={isActionLoading || downloadDisabled}
              onClick={onDownload}
              className="mt-5 h-[44px] w-full rounded-full px-7"
            >
              <span className="inline-flex items-center gap-2">
                <Download size={16} />
                {translatedDownloadLabel}
              </span>
            </Button>
          )}
        </div>
      ) : null}

      {!generatedPreview && planHint ? (
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
