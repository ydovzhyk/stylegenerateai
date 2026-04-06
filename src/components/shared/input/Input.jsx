'use client'

import clsx from 'clsx'
import { forwardRef, useMemo, useState } from 'react'
import { useTranslate } from '@/utils/translate/translate'

function isPrimitiveText(value) {
  return typeof value === 'string' || typeof value === 'number'
}

const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    hint,
    placeholder,
    className,
    inputClassName,
    labelClassName,
    helpClassName,
    as = 'input',
    rows = 6,
    leftIcon,
    rightIcon,
    required = false,
    translate = true,
    translateError = true,
    caseMode = 'auto',
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false)

  const describedById = id ? `${id}__help` : undefined
  const Comp = as === 'textarea' ? 'textarea' : 'input'
  const hasLeftIcon = Boolean(leftIcon)
  const hasRightIcon = Boolean(rightIcon)

  const showErrorState = Boolean(error) && !isFocused

  const translatedLabel = useTranslate(
    translate && isPrimitiveText(label) ? String(label) : '',
    { caseMode },
  )

  const translatedPlaceholder = useTranslate(
    translate && isPrimitiveText(placeholder) ? String(placeholder) : '',
    { caseMode },
  )

  const translatedHint = useTranslate(
    translate && isPrimitiveText(hint) ? String(hint) : '',
    { caseMode },
  )

  const translatedError = useTranslate(
    translate && translateError && isPrimitiveText(error) ? String(error) : '',
    { caseMode: 'sentence' },
  )

  const resolvedLabel =
    translate && isPrimitiveText(label) ? translatedLabel : label

  const resolvedPlaceholder =
    translate && isPrimitiveText(placeholder)
      ? translatedPlaceholder
      : placeholder

  const resolvedHint =
    translate && isPrimitiveText(hint) ? translatedHint : hint

  const resolvedError =
    translate && translateError && isPrimitiveText(error)
      ? translatedError
      : error

  const helpText = useMemo(() => {
    return resolvedError || resolvedHint || '\u00A0'
  }, [resolvedError, resolvedHint])

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  return (
    <div className={clsx('input-group', className)}>
      {resolvedLabel ? (
        <label
          htmlFor={id}
          className={clsx(
            'mb-2 block text-sm font-medium text-foreground-soft',
            labelClassName,
          )}
        >
          {resolvedLabel}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {hasLeftIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-foreground-faint">
            {leftIcon}
          </span>
        ) : null}

        <Comp
          ref={ref}
          id={id}
          placeholder={resolvedPlaceholder}
          className={clsx(
            as === 'textarea' ? 'textarea-dark' : 'input-dark',
            hasLeftIcon && as !== 'textarea' && 'pl-11',
            hasRightIcon && as !== 'textarea' && 'pr-11',
            showErrorState &&
              'border-danger/60 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]',
            inputClassName,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedById}
          rows={as === 'textarea' ? rows : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {hasRightIcon ? (
          <span className="pointer-events-none absolute right-4 top-1/2 z-[1] -translate-y-1/2 text-foreground-faint">
            {rightIcon}
          </span>
        ) : null}
      </div>

      <span
        id={describedById}
        className={clsx(
          'mt-2 block min-h-5 text-xs leading-5 text-foreground-faint',
          resolvedError && 'text-danger',
          helpClassName,
        )}
      >
        {helpText}
      </span>
    </div>
  )
})

export default Input
