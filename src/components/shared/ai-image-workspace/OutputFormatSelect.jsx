'use client'

import { useMemo } from 'react'
import { Lock } from 'lucide-react'
import Select from '@/components/shared/select/Select'
import { HoverTip } from '@/components/shared/info-hint/InfoHint'
import { getLockedText } from '@/hooks/useGenerationPlanAccess'

const SECTION_TITLE_LABEL_CLASS = 'text-lg font-semibold text-white md:text-xl'
const FIELD_CONTROL_HEIGHT = 52

function formatLockedOptionLabel(option) {
  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="flex min-w-0 flex-col gap-px text-left">
        <span className="font-medium leading-5">{option.label}</span>
        {option.description ? (
          <span className="text-xs leading-4 text-white/55">
            {option.description}
          </span>
        ) : null}
      </span>
      {option.isLocked ? (
        <HoverTip
          text={
            option.lockedMessage ||
            'This option is not available for your plan.'
          }
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

export default function OutputFormatSelect({
  outputFormat,
  setOutputFormat,
  outputFormats = [],
  isFormatAllowed,
  getOptionLockedReason,
  planKey,
  isLogin,
  disabled = false,
  className = '',
}) {
  const outputFormatOptions = useMemo(
    () =>
      outputFormats.map((item) => {
        const locked =
          typeof isFormatAllowed === 'function'
            ? !isFormatAllowed(item.id)
            : false
        const lockedReason =
          typeof getOptionLockedReason === 'function'
            ? getOptionLockedReason('outputFormat', item.id)
            : null

        return {
          value: item.id,
          label: item.label,
          description: item.description,
          isLocked: locked,
          isDisabled: locked,
          lockedMessage: locked
            ? getLockedText({ planKey, isLogin, lockedReason })
            : '',
        }
      }),
    [
      outputFormats,
      isFormatAllowed,
      getOptionLockedReason,
      planKey,
      isLogin,
    ],
  )

  const selectedOutputFormat =
    outputFormatOptions.find((option) => option.value === outputFormat) || null

  return (
    <div className={className}>
      <Select
        id="output-format"
        label="Output format"
        labelClassName={SECTION_TITLE_LABEL_CLASS}
        options={outputFormatOptions}
        value={selectedOutputFormat}
        onChange={(option) => {
          if (!option?.value || option.isLocked) return
          setOutputFormat?.(option.value)
        }}
        isOptionDisabled={(option) => Boolean(option.isLocked)}
        isDisabled={disabled}
        formatOptionLabel={formatLockedOptionLabel}
        placeholder="Select output format"
        hideHelp
        menuPlacement="bottom"
        controlMinHeight={FIELD_CONTROL_HEIGHT}
      />
    </div>
  )
}
