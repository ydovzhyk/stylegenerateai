'use client'

import clsx from 'clsx'
import { GripVertical } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_OBJECT_POSITION = '50% 18%'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function shouldShowBeforePreview(position, threshold = 50) {
  return position >= threshold
}

function ShinyBadge({ children, className = '', shineSeed = 'comparison-after' }) {
  return (
    <span
      key={shineSeed}
      className={`relative inline-flex isolate overflow-hidden ${className}`}
    >
      <span className="relative z-[2]">{children}</span>

      <span className="pointer-events-none absolute bottom-[-20%] left-[-120%] top-[-20%] z-[1] w-[60%] animate-premium-shine-sweep bg-[linear-gradient(120deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_20%,rgba(255,255,255,0.52)_50%,rgba(255,255,255,0.08)_80%,rgba(255,255,255,0)_100%)] opacity-0" />
    </span>
  )
}

export function ComparisonPreviewBadge({
  beforeLabel = 'Before',
  afterLabel = 'After',
  position = 100,
  threshold = 50,
  shineSeed = 'comparison-after',
  wrapperClassName = '',
  badgeClassName = '',
}) {
  const showBefore = shouldShowBeforePreview(position, threshold)
  const label = showBefore ? beforeLabel : afterLabel

  const badge = showBefore ? (
    <span
      className={clsx(
        'inline-flex rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm',
        badgeClassName,
      )}
    >
      {label}
    </span>
  ) : (
    <ShinyBadge
      shineSeed={shineSeed}
      className={clsx(
        'rounded-full border border-cyan-400/25 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-300 backdrop-blur-sm',
        badgeClassName,
      )}
    >
      {label}
    </ShinyBadge>
  )

  if (!wrapperClassName) {
    return badge
  }

  return <div className={wrapperClassName}>{badge}</div>
}

export function resolveComparisonPreviewTarget(
  comparison,
  position,
  { title = '', threshold = 50 } = {},
) {
  const showBefore = shouldShowBeforePreview(position, threshold)

  return {
    src: showBefore ? comparison.beforeUrl : comparison.afterUrl,
    alt: showBefore ? comparison.beforeLabel : comparison.afterLabel,
    title: title
      ? `${title} — ${showBefore ? comparison.beforeLabel : comparison.afterLabel}`
      : showBefore
        ? comparison.beforeLabel
        : comparison.afterLabel,
  }
}

export default function BeforeAfterComparisonSlider({
  beforeSrc = '',
  afterSrc = '',
  beforeLabel = 'Before',
  afterLabel = 'After',
  initialPosition = 100,
  objectPosition = DEFAULT_OBJECT_POSITION,
  className = '',
  showLabels = true,
  disabled = false,
  onPositionChange,
}) {
  const containerRef = useRef(null)
  const dragStateRef = useRef({ active: false, pointerId: null })
  const [position, setPosition] = useState(initialPosition)

  const updatePositionFromClientX = useCallback((clientX) => {
    const container = containerRef.current

    if (!container) return

    const rect = container.getBoundingClientRect()

    if (!rect.width) return

    const nextPosition = ((clientX - rect.left) / rect.width) * 100
    setPosition(clamp(nextPosition, 0, 100))
  }, [])

  useEffect(() => {
    setPosition(initialPosition)
  }, [beforeSrc, afterSrc, initialPosition])

  useEffect(() => {
    onPositionChange?.(position)
  }, [onPositionChange, position])

  useEffect(() => {
    const stopDragging = () => {
      dragStateRef.current.active = false
      dragStateRef.current.pointerId = null
    }

    const handlePointerMove = (event) => {
      if (
        !dragStateRef.current.active ||
        dragStateRef.current.pointerId !== event.pointerId
      ) {
        return
      }

      updatePositionFromClientX(event.clientX)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [updatePositionFromClientX])

  const handlePointerDown = (event) => {
    if (disabled) return

    event.preventDefault()
    dragStateRef.current.active = true
    dragStateRef.current.pointerId = event.pointerId
    containerRef.current?.setPointerCapture?.(event.pointerId)
    updatePositionFromClientX(event.clientX)
  }

  const objectPositionClass =
    objectPosition === DEFAULT_OBJECT_POSITION
      ? 'object-[50%_18%]'
      : undefined

  const objectPositionStyle =
    objectPositionClass ? undefined : { objectPosition }

  const imageClassName = clsx(
    'pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover',
    objectPositionClass,
  )

  const imageStyle = {
    width: '102%',
    height: '102%',
    ...objectPositionStyle,
  }

  const showAfterOverlay = position < 99.5

  if (!beforeSrc || !afterSrc) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative h-full w-full touch-none select-none overflow-hidden',
        disabled ? 'cursor-default' : 'cursor-ew-resize',
        className,
      )}
      onPointerDown={handlePointerDown}
      role="img"
      aria-label={`${beforeLabel} and ${afterLabel} comparison`}
    >
      <img
        src={beforeSrc}
        alt={beforeLabel}
        draggable={false}
        className={imageClassName}
        style={imageStyle}
      />

      {showAfterOverlay ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <img
            src={afterSrc}
            alt={afterLabel}
            draggable={false}
            className={imageClassName}
            style={imageStyle}
          />
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-y-0 z-[2]"
        style={{ left: `${position}%` }}
      >
        <div className="relative h-full w-px -translate-x-1/2 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.45)]" />

        <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <GripVertical size={18} />
        </div>
      </div>

      {showLabels ? (
        <ComparisonPreviewBadge
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
          position={position}
          shineSeed={`${beforeSrc}-${afterSrc}`}
          wrapperClassName="pointer-events-none absolute bottom-4 right-4 z-[3]"
        />
      ) : null}
    </div>
  )
}
