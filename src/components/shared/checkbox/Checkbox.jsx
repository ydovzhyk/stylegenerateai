'use client'

import clsx from 'clsx'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SIZE_CLASSES = {
  sm: 'h-3.5 w-3.5 rounded-[0.3rem]',
  md: 'h-4 w-4 rounded-[0.35rem]',
}

const ICON_SIZE_CLASSES = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
}

const Checkbox = forwardRef(function Checkbox(
  {
    id,
    checked,
    indeterminate = false,
    disabled = false,
    onChange,
    className,
    inputClassName,
    size = 'md',
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const localRef = useRef(null)
  const resolvedSize = SIZE_CLASSES[size] ? size : 'md'
  const isControlled = checked !== undefined

  useEffect(() => {
    if (localRef.current) {
      localRef.current.indeterminate = Boolean(indeterminate)
    }
  }, [indeterminate])

  useImperativeHandle(ref, () => localRef.current)

  return (
    <span
      className={clsx(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
    >
      <input
        ref={localRef}
        id={id}
        type="checkbox"
        disabled={disabled}
        onChange={onChange}
        aria-label={ariaLabel}
        {...(isControlled ? { checked: Boolean(checked) } : null)}
        className={clsx(
          'peer appearance-none border transition-[background-color,border-color,box-shadow]',
          'border-white/25 bg-white/[0.04]',
          'hover:border-white/40',
          'checked:border-[var(--primary)] checked:bg-[var(--primary)]',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(124,92,255,0.28)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          indeterminate && 'border-[var(--primary)] bg-[var(--primary)]',
          SIZE_CLASSES[resolvedSize],
          inputClassName,
        )}
        {...props}
      />

      <svg
        viewBox="0 0 12 12"
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute text-white opacity-0 transition-opacity',
          'peer-checked:opacity-100',
          indeterminate && 'opacity-0',
          ICON_SIZE_CLASSES[resolvedSize],
        )}
      >
        <path
          d="M2.2 6.2 4.8 8.7 9.8 3.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute h-[1.5px] w-2 rounded-full bg-white opacity-0 transition-opacity',
          indeterminate && 'opacity-100',
        )}
      />
    </span>
  )
})

export default Checkbox
