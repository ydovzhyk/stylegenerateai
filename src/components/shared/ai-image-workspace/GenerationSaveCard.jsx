'use client'

import { useMemo } from 'react'
import { Download, Lock } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import InfoHint, { HoverTip } from '@/components/shared/info-hint/InfoHint'
import { useTranslate } from '@/utils/translate/translate'

const SUB_BLOCK_LABEL_CLASS = 'text-base font-medium text-white'
const SAVE_FIELD_CONTROL_HEIGHT = 40

function formatLockedOptionLabel(option, { context } = {}) {
  const showDescription = context === 'menu' && Boolean(option.description)

  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="flex min-w-0 flex-col gap-px text-left">
        <span className="font-medium leading-5">{option.label}</span>
        {showDescription ? (
          <span className="text-xs leading-4 text-white/55">
            {option.description}
          </span>
        ) : null}
      </span>
      {option.isLocked ? (
        <HoverTip
          text={option.lockedMessage || 'Upgrade to a paid plan to unlock this file format.'}
          placement="top"
          align="end"
          widthClassName="w-[220px]"
          className="shrink-0"
        >
          <span
            className="inline-flex items-center justify-center p-0.5"
            aria-label={option.lockedMessage || 'Locked'}
          >
            <Lock size={14} className="opacity-70" />
          </span>
        </HoverTip>
      ) : null}
    </span>
  )
}

export default function GenerationSaveCard({
  active = false,
  onDownload,
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

  printExportProcessing = false,
  printExportProgress = null,
  downloadDisabled = false,
  showFileFormat = true,
  showGallerySave = true,
  downloadOptionsTitle = 'Download options',
  titleLabel = 'Image title',
  titlePlaceholder = 'My generated look',
  titleInputId = 'generated-image-title',
  gallerySaveHint = 'The image will be saved before downloading.',
  buttonDownload = 'Download',
  buttonDownloadProcessing = 'Processing…',
  printExportProcessingHint = "We're preparing your file format. Please wait - this may take a little while.",
}) {
  const translatedDownloadLabel = useTranslate(buttonDownload, {
    caseMode: 'sentence',
  })
  const translatedProcessingLabel = useTranslate(buttonDownloadProcessing, {
    caseMode: 'sentence',
  })

  const showFileFormatSelect =
    showFileFormat && generatedImageFormats.length > 0

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
          lockedMessage: locked ? formatLockedText : '',
        }
      }),
    [generatedImageFormats, isGeneratedImageFormatAllowed, formatLockedText],
  )

  const selectedFileFormat =
    fileFormatOptions.find((option) => option.value === generatedImageFormat) ||
    null

  return (
    <div
      className={`flex min-h-[260px] flex-col rounded-[26px] border border-white/10 bg-white/[0.025] p-5 text-left transition ${
        active ? '' : 'opacity-60'
      }`}
    >
      <Text variant="section-title" color="white" className="mb-4">
        {downloadOptionsTitle}
      </Text>

      <fieldset disabled={!active} className="min-w-0 disabled:pointer-events-none">
        <Input
          id={titleInputId}
          label={titleLabel}
          labelClassName={SUB_BLOCK_LABEL_CLASS}
          placeholder={titlePlaceholder}
          value={imageTitle}
          onChange={(e) => setImageTitle?.(e.target.value)}
          inputClassName="h-10 min-h-10 py-0"
        />

        {showFileFormatSelect ? (
          <div className="mt-4">
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
              formatOptionLabel={formatLockedOptionLabel}
              placeholder="Select file format"
              hideHelp
              menuPlacement="top"
              controlMinHeight={SAVE_FIELD_CONTROL_HEIGHT}
            />
          </div>
        ) : null}

        {showGallerySave ? (
          isLogin ? (
            <div className="mt-4 flex items-center justify-between">
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
              <InfoHint
                text={gallerySaveHint}
                label="Save to gallery hint"
                align="end"
                placement="bottom"
              />
            </div>
          ) : (
            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-4"
            >
              Sign in to save this to your gallery.
            </Text>
          )
        ) : null}

        <div className="mt-5 flex justify-center">
          {printExportProcessing ? (
            <HoverTip text={printExportProcessingHint}>
              <Button
                type="button"
                variant="secondary"
                disabled
                translate={false}
                className="h-[44px] w-auto rounded-full px-7"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{translatedProcessingLabel}</span>
                  <span className="tabular-nums">
                    {Math.max(0, printExportProgress ?? 0)}%
                  </span>
                </span>
              </Button>
            </HoverTip>
          ) : (
            <Button
              type="button"
              variant="secondary"
              loading={saveLoading}
              disabled={!active || saveLoading || downloadDisabled}
              onClick={onDownload}
              className="h-[44px] w-auto rounded-full px-7"
            >
              <span className="inline-flex items-center gap-2">
                <Download size={16} />
                {translatedDownloadLabel}
              </span>
            </Button>
          )}
        </div>
      </fieldset>
    </div>
  )
}
