'use client'

import clsx from 'clsx'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  USER_PROMPT_FILL_HEIGHT_MQ,
  WORKSPACE_PREP_OPTIONS_ATTR,
} from '@/constants/user-prompt'
import { useTranslate } from '@/utils/translate/translate'

/**
 * Keep 1px inside Block 2 so the frame bottom border is not clipped by
 * overflow-y-auto (top/bottom padding of the parent card stay equal).
 */
const FILL_CLIP_INSET_PX = 1

/**
 * Mobile browser chrome show/hide can jitter layout by a few px and fire
 * resize. Ignore tiny shell changes so the prompt textarea does not jump.
 */
const SHELL_RESIZE_TOLERANCE_PX = 6

function isPrimitiveText(value) {
  return typeof value === 'string' || typeof value === 'number'
}

/** Leftover px inside Block 2 (scrollHeight === clientHeight when content fits). */
function getShellFreeSpace(shell) {
  if (!shell) return 0
  const gap =
    parseFloat(getComputedStyle(shell).rowGap || getComputedStyle(shell).gap) ||
    0
  const children = Array.from(shell.children)
  let used = 0
  children.forEach((child, index) => {
    used += child.offsetHeight
    if (index < children.length - 1) used += gap
  })
  return shell.clientHeight - used
}

function getShellSize(shell) {
  if (!shell) return { width: 0, height: 0 }
  return { width: shell.clientWidth, height: shell.clientHeight }
}

function shellSizeChanged(prev, next, tolerance = SHELL_RESIZE_TOLERANCE_PX) {
  if (!prev) return true
  return (
    Math.abs(prev.width - next.width) >= tolerance ||
    Math.abs(prev.height - next.height) >= tolerance
  )
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
    autoGrow = false,
    fillHeight = false,
    onFocus,
    onBlur,
    onChange,
    value,
    ...props
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false)
  const [allowFillHeight, setAllowFillHeight] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(USER_PROMPT_FILL_HEIGHT_MQ).matches
  })
  const localRef = useRef(null)
  const lastShellSizeRef = useRef(null)
  const syncTextareaHeightRef = useRef(() => {})

  useImperativeHandle(ref, () => localRef.current)

  const describedById = id ? `${id}__help` : undefined
  const Comp = as === 'textarea' ? 'textarea' : 'input'
  const hasLeftIcon = Boolean(leftIcon)
  const hasRightIcon = Boolean(rightIcon)
  const isAutoGrowTextarea = as === 'textarea' && autoGrow
  // Mobile: content height only. Fill leftover Block 2 space from md up.
  const isFillHeightTextarea =
    as === 'textarea' && fillHeight && allowFillHeight

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

  const showHelp = Boolean(resolvedError || resolvedHint)
  const helpText = useMemo(() => {
    return resolvedError || resolvedHint || '\u00A0'
  }, [resolvedError, resolvedHint])

  const syncTextareaHeight = () => {
    const node = localRef.current
    if (!node || (!isAutoGrowTextarea && !isFillHeightTextarea)) return

    // Remember the painted size. Measuring needs height:auto, but if the
    // final size is unchanged we restore it in the same turn (before paint)
    // so mobile chrome resize does not flash a collapsed textarea.
    const committedHeight = node.offsetHeight
    const previousInlineHeight = node.style.height

    node.style.height = 'auto'
    const contentHeight = node.scrollHeight
    let nextHeight = contentHeight

    if (isFillHeightTextarea) {
      // Apply content height, then consume leftover space in Block 2 so the
      // bottom inset matches the parent card padding (same as the top).
      node.style.height = `${contentHeight}px`
      const shell = node.closest(`[${WORKSPACE_PREP_OPTIONS_ATTR}]`)
      const free = getShellFreeSpace(shell)
      if (free > FILL_CLIP_INSET_PX) {
        nextHeight = contentHeight + free - FILL_CLIP_INSET_PX
      }
      lastShellSizeRef.current = getShellSize(shell)
    }

    nextHeight = Math.ceil(nextHeight)

    if (Math.abs(committedHeight - nextHeight) < 1) {
      node.style.height =
        previousInlineHeight && previousInlineHeight !== 'auto'
          ? previousInlineHeight
          : `${committedHeight}px`
      return
    }

    node.style.height = `${nextHeight}px`
  }

  syncTextareaHeightRef.current = syncTextareaHeight

  useEffect(() => {
    if (!fillHeight) {
      setAllowFillHeight(false)
      return undefined
    }

    const media = window.matchMedia(USER_PROMPT_FILL_HEIGHT_MQ)
    const update = () => setAllowFillHeight(media.matches)
    update()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }

    media.addListener(update)
    return () => media.removeListener(update)
  }, [fillHeight])

  useLayoutEffect(() => {
    syncTextareaHeightRef.current()
    // Aspect-ratio / flex height often settles one frame later.
    const raf = window.requestAnimationFrame(() => {
      syncTextareaHeightRef.current()
    })
    return () => window.cancelAnimationFrame(raf)
  }, [
    isAutoGrowTextarea,
    isFillHeightTextarea,
    allowFillHeight,
    value,
    resolvedPlaceholder,
    rows,
  ])

  useEffect(() => {
    if (!isAutoGrowTextarea && !isFillHeightTextarea) return undefined

    const shell = localRef.current?.closest(
      `[${WORKSPACE_PREP_OPTIONS_ATTR}]`,
    )

    const syncIfShellChanged = () => {
      if (!isFillHeightTextarea) {
        // Content-only autoGrow does not depend on viewport chrome.
        return
      }
      const nextSize = getShellSize(shell)
      if (!shellSizeChanged(lastShellSizeRef.current, nextSize)) return
      lastShellSizeRef.current = nextSize
      syncTextareaHeightRef.current()
    }

    // Mobile URL-bar show/hide fires window/visualViewport resize without a
    // real Block 2 size change. Gate every listener on shell geometry.
    if (shell) {
      lastShellSizeRef.current = getShellSize(shell)
    }

    const visualViewport = window.visualViewport
    window.addEventListener('resize', syncIfShellChanged)
    visualViewport?.addEventListener('resize', syncIfShellChanged)

    let observer
    if (
      isFillHeightTextarea &&
      shell &&
      typeof ResizeObserver !== 'undefined'
    ) {
      observer = new ResizeObserver(() => {
        syncIfShellChanged()
      })
      observer.observe(shell)
    }

    return () => {
      window.removeEventListener('resize', syncIfShellChanged)
      visualViewport?.removeEventListener('resize', syncIfShellChanged)
      observer?.disconnect()
    }
  }, [isAutoGrowTextarea, isFillHeightTextarea])

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const handleChange = (e) => {
    onChange?.(e)
    if (isAutoGrowTextarea || isFillHeightTextarea) {
      syncTextareaHeightRef.current()
    }
  }

  return (
    <div className={clsx('input-group', className)}>
      {resolvedLabel ? (
        <label
          htmlFor={id}
          className={clsx(
            'mb-2 block shrink-0',
            labelClassName ?? 'text-sm font-medium text-foreground-soft',
          )}
        >
          {resolvedLabel}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}

      <div
        className={clsx(
          'relative',
          as === 'textarea' && 'textarea-dark-frame',
          as === 'textarea' && showErrorState && 'is-invalid',
        )}
      >
        {hasLeftIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-foreground-faint">
            {leftIcon}
          </span>
        ) : null}

        <Comp
          ref={localRef}
          id={id}
          placeholder={resolvedPlaceholder}
          value={value}
          className={clsx(
            as === 'textarea' ? 'textarea-dark textarea-dark--framed' : 'input-dark',
            hasLeftIcon && as !== 'textarea' && 'pl-11',
            hasRightIcon && as !== 'textarea' && 'pr-11',
            as !== 'textarea' &&
              showErrorState &&
              'border-danger/60 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]',
            (isAutoGrowTextarea || isFillHeightTextarea) && 'overflow-hidden',
            inputClassName,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedById}
          rows={as === 'textarea' ? rows : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {hasRightIcon ? (
          <span className="pointer-events-none absolute right-4 top-1/2 z-[1] -translate-y-1/2 text-foreground-faint">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {showHelp ? (
        <span
          id={describedById}
          className={clsx(
            'mt-2 block text-xs leading-5 text-foreground-faint',
            resolvedError && 'text-danger',
            helpClassName,
          )}
        >
          {helpText}
        </span>
      ) : (
        <span id={describedById} className="sr-only" />
      )}
    </div>
  )
})

export default Input
