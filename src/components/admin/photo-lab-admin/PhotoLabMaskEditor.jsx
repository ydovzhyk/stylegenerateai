'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'
import Text from '@/components/shared/text/Text'

export const PHOTO_LAB_MASK_BRUSH_SIZES = {
  small: 4,
  medium: 8,
  large: 14,
}

export const PHOTO_LAB_MASK_ZOOM = {
  min: 1,
  max: 3,
  step: 0.1,
}

const MIN_ZOOM = PHOTO_LAB_MASK_ZOOM.min
const MAX_ZOOM = PHOTO_LAB_MASK_ZOOM.max
const ZOOM_STEP = PHOTO_LAB_MASK_ZOOM.step

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function roundZoom(value) {
  return Math.round(value * 100) / 100
}

function drawVisualStroke(ctx, x, y, radius, tool) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)

  if (tool === 'brush') {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(255, 70, 70, 0.55)'
    ctx.fill()
  } else {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.fill()
  }

  ctx.restore()
}

function drawMaskStroke(ctx, x, y, radius, tool) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)

  if (tool === 'brush') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.fill()
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'
    ctx.fill()
  }

  ctx.restore()
}

function maskHasEditableRegion(maskCanvas) {
  const ctx = maskCanvas.getContext('2d')

  if (!ctx) return false

  const { width, height } = maskCanvas
  const { data } = ctx.getImageData(0, 0, width, height)

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) {
      return true
    }
  }

  return false
}

function redrawDisplayFromMask(displayCanvas, maskCanvas) {
  const displayCtx = displayCanvas.getContext('2d')
  const maskCtx = maskCanvas.getContext('2d')

  if (!displayCtx || !maskCtx) return

  displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height)

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = displayCanvas.width
  tempCanvas.height = displayCanvas.height

  const tempCtx = tempCanvas.getContext('2d')

  if (!tempCtx) return

  tempCtx.drawImage(
    maskCanvas,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height,
  )

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
  displayCtx.fillStyle = 'rgba(255, 70, 70, 0.55)'

  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index + 3] < 250) {
      const pixelIndex = index / 4
      const x = pixelIndex % tempCanvas.width
      const y = Math.floor(pixelIndex / tempCanvas.width)
      displayCtx.fillRect(x, y, 1, 1)
    }
  }
}

const PhotoLabMaskEditor = forwardRef(function PhotoLabMaskEditor(
  {
    imageFile = null,
    brushSize = PHOTO_LAB_MASK_BRUSH_SIZES.medium,
    tool = 'brush',
    paintActive = true,
    disabled = false,
    className = '',
    onHasMaskChange,
    onPanModeEnter,
    onFitView,
    onZoomChange,
    fillContainer = false,
    viewportPadding = 24,
  },
  ref,
) {
  const viewportRef = useRef(null)
  const contentRef = useRef(null)
  const imageRef = useRef(null)
  const displayCanvasRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const layoutRef = useRef({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    scaleX: 1,
    scaleY: 1,
  })
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const activePointerIdRef = useRef(null)
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  })

  const [imageUrl, setImageUrl] = useState('')
  const [hasMask, setHasMask] = useState(false)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const canPan = zoom > MIN_ZOOM
  const isPanMode = canPan && !paintActive
  const canPaint = paintActive

  const updateHasMask = useCallback(
    (nextValue) => {
      setHasMask(nextValue)
      onHasMaskChange?.(nextValue)
    },
    [onHasMaskChange],
  )

  const previousZoomRef = useRef(MIN_ZOOM)

  const resetView = useCallback(() => {
    setZoom(MIN_ZOOM)
    setPan({ x: 0, y: 0 })
  }, [])

  const clampPan = useCallback((nextPan, nextZoom = zoom) => {
    const viewport = viewportRef.current
    const content = contentRef.current

    if (!viewport || !content || nextZoom <= MIN_ZOOM) {
      return { x: 0, y: 0 }
    }

    const viewportRect = viewport.getBoundingClientRect()
    const baseWidth = content.offsetWidth
    const baseHeight = content.offsetHeight

    if (!baseWidth || !baseHeight) return nextPan

    const scaledWidth = baseWidth * nextZoom
    const scaledHeight = baseHeight * nextZoom
    const maxX = Math.max(0, (scaledWidth - viewportRect.width) / 2)
    const maxY = Math.max(0, (scaledHeight - viewportRect.height) / 2)

    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    }
  }, [zoom])

  const updateZoom = useCallback(
    (value) => {
      const nextZoom = roundZoom(clamp(value, MIN_ZOOM, MAX_ZOOM))
      setZoom(nextZoom)
      setPan((current) => clampPan(current, nextZoom))
    },
    [clampPan],
  )

  useEffect(() => {
    const previousZoom = previousZoomRef.current

    if (zoom > MIN_ZOOM && previousZoom <= MIN_ZOOM) {
      onPanModeEnter?.()
    } else if (zoom <= MIN_ZOOM && previousZoom > MIN_ZOOM) {
      onFitView?.()
    }

    previousZoomRef.current = zoom
  }, [zoom, onFitView, onPanModeEnter])

  useEffect(() => {
    onZoomChange?.({
      zoom,
      zoomPercent: Math.round(zoom * 100),
      canResetView: zoom > MIN_ZOOM || pan.x !== 0 || pan.y !== 0,
    })
  }, [zoom, pan, onZoomChange])

  const syncHasMaskFromCanvas = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    updateHasMask(Boolean(maskCanvas && maskHasEditableRegion(maskCanvas)))
  }, [updateHasMask])

  const initializeMaskCanvas = useCallback(
    (naturalWidth, naturalHeight) => {
      const maskCanvas = maskCanvasRef.current

      if (!maskCanvas) return

      maskCanvas.width = naturalWidth
      maskCanvas.height = naturalHeight

      const maskCtx = maskCanvas.getContext('2d')

      if (!maskCtx) return

      maskCtx.clearRect(0, 0, naturalWidth, naturalHeight)
      maskCtx.fillStyle = '#ffffff'
      maskCtx.fillRect(0, 0, naturalWidth, naturalHeight)
      updateHasMask(false)
    },
    [updateHasMask],
  )

  const clearDisplayCanvas = useCallback(() => {
    const displayCanvas = displayCanvasRef.current

    if (!displayCanvas) return

    const displayCtx = displayCanvas.getContext('2d')

    if (!displayCtx) return

    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height)
  }, [])

  const measureLayout = useCallback(() => {
    const viewport = viewportRef.current
    const image = imageRef.current
    const displayCanvas = displayCanvasRef.current

    if (!viewport || !image || !displayCanvas) return
    if (!image.naturalWidth || !image.naturalHeight) return

    const viewportWidth = viewport.clientWidth
    const viewportHeight = viewport.clientHeight
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    const fitScale = Math.min(
      (viewportWidth - viewportPadding) / naturalWidth,
      (viewportHeight - viewportPadding) / naturalHeight,
    )
    const width = Math.max(1, Math.round(naturalWidth * fitScale))
    const height = Math.max(1, Math.round(naturalHeight * fitScale))
    const previousLayout = layoutRef.current
    const sizeChanged =
      previousLayout.width !== width || previousLayout.height !== height

    layoutRef.current = {
      width,
      height,
      naturalWidth,
      naturalHeight,
      scaleX: naturalWidth / width,
      scaleY: naturalHeight / height,
    }

    image.style.width = `${width}px`
    image.style.height = `${height}px`

    displayCanvas.style.width = `${width}px`
    displayCanvas.style.height = `${height}px`

    if (sizeChanged) {
      displayCanvas.width = width
      displayCanvas.height = height

      if (
        !maskCanvasRef.current?.width ||
        maskCanvasRef.current.width !== naturalWidth ||
        maskCanvasRef.current.height !== naturalHeight
      ) {
        initializeMaskCanvas(naturalWidth, naturalHeight)
        clearDisplayCanvas()
      } else if (maskCanvasRef.current) {
        redrawDisplayFromMask(displayCanvas, maskCanvasRef.current)
      }
    }

    if (
      !maskCanvasRef.current?.width ||
      maskCanvasRef.current.width !== naturalWidth ||
      maskCanvasRef.current.height !== naturalHeight
    ) {
      initializeMaskCanvas(naturalWidth, naturalHeight)
    }

    setPan((current) => clampPan(current, zoom))
  }, [clampPan, clearDisplayCanvas, initializeMaskCanvas, viewportPadding, zoom])

  useEffect(() => {
    if (!imageFile) {
      setImageUrl('')
      updateHasMask(false)
      resetView()
      return
    }

    const nextUrl = URL.createObjectURL(imageFile)
    setImageUrl(nextUrl)
    resetView()

    return () => {
      URL.revokeObjectURL(nextUrl)
    }
  }, [imageFile, resetView, updateHasMask])

  useEffect(() => {
    if (!imageUrl) return

    const viewport = viewportRef.current

    if (!viewport) return

    measureLayout()

    const resizeObserver = new ResizeObserver(() => {
      measureLayout()
    })

    resizeObserver.observe(viewport)

    return () => {
      resizeObserver.disconnect()
    }
  }, [imageUrl, measureLayout])

  useEffect(() => {
    if (!isPanMode || !canPan) return

    const handlePointerMove = (event) => {
      const drag = dragStateRef.current

      if (!drag.active) return

      const deltaX = event.clientX - drag.startX
      const deltaY = event.clientY - drag.startY

      setPan(
        clampPan({
          x: drag.panX + deltaX,
          y: drag.panY + deltaY,
        }),
      )
    }

    const stopDragging = () => {
      dragStateRef.current.active = false
      dragStateRef.current.pointerId = null
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [canPan, clampPan, isPanMode])

  const getPointerPosition = useCallback(
    (event) => {
      const displayCanvas = displayCanvasRef.current
      const layout = layoutRef.current

      if (!displayCanvas || !layout.scaleX) return null

      const rect = displayCanvas.getBoundingClientRect()

      if (!rect.width || !rect.height) return null

      const displayX =
        (event.clientX - rect.left) * (displayCanvas.width / rect.width)
      const displayY =
        (event.clientY - rect.top) * (displayCanvas.height / rect.height)

      if (
        displayX < 0 ||
        displayY < 0 ||
        displayX > displayCanvas.width ||
        displayY > displayCanvas.height
      ) {
        return null
      }

      const imageSpaceBrushRadius = (brushSize / 2) * layout.scaleX / zoom

      return {
        displayX,
        displayY,
        maskX: displayX * layout.scaleX,
        maskY: displayY * layout.scaleY,
        displayRadius: imageSpaceBrushRadius / layout.scaleX,
        maskRadius: imageSpaceBrushRadius,
      }
    },
    [brushSize, zoom],
  )

  const paintStroke = useCallback(
    (point) => {
      const displayCanvas = displayCanvasRef.current
      const maskCanvas = maskCanvasRef.current

      if (!displayCanvas || !maskCanvas || !point) return

      const displayCtx = displayCanvas.getContext('2d')
      const maskCtx = maskCanvas.getContext('2d')

      if (!displayCtx || !maskCtx) return

      const lastPoint = lastPointRef.current
      const distance = lastPoint
        ? Math.hypot(point.displayX - lastPoint.displayX, point.displayY - lastPoint.displayY)
        : 0
      const steps = lastPoint ? Math.max(4, Math.ceil(distance / 2)) : 0

      for (let step = 0; step <= steps; step += 1) {
        const ratio = steps === 0 ? 0 : step / steps
        const displayX = lastPoint
          ? lastPoint.displayX + (point.displayX - lastPoint.displayX) * ratio
          : point.displayX
        const displayY = lastPoint
          ? lastPoint.displayY + (point.displayY - lastPoint.displayY) * ratio
          : point.displayY
        const maskX = lastPoint
          ? lastPoint.maskX + (point.maskX - lastPoint.maskX) * ratio
          : point.maskX
        const maskY = lastPoint
          ? lastPoint.maskY + (point.maskY - lastPoint.maskY) * ratio
          : point.maskY

        drawVisualStroke(
          displayCtx,
          displayX,
          displayY,
          point.displayRadius,
          tool,
        )
        drawMaskStroke(maskCtx, maskX, maskY, point.maskRadius, tool)
      }

      lastPointRef.current = point
      syncHasMaskFromCanvas()
    },
    [syncHasMaskFromCanvas, tool],
  )

  const handleCanvasPointerDown = (event) => {
    if (disabled || !canPaint) return

    event.preventDefault()
    event.stopPropagation()
    isDrawingRef.current = true
    lastPointRef.current = null
    activePointerIdRef.current = event.pointerId
    displayCanvasRef.current?.setPointerCapture(event.pointerId)

    const point = getPointerPosition(event)

    if (point) {
      paintStroke(point)
    }
  }

  const handleCanvasPointerMove = (event) => {
    if (
      !canPaint ||
      !isDrawingRef.current ||
      disabled ||
      activePointerIdRef.current !== event.pointerId
    ) {
      return
    }

    event.preventDefault()

    const point = getPointerPosition(event)

    if (point) {
      paintStroke(point)
    }
  }

  const stopDrawing = (event) => {
    if (
      event?.pointerId != null &&
      activePointerIdRef.current !== event.pointerId
    ) {
      return
    }

    if (event?.pointerId != null) {
      displayCanvasRef.current?.releasePointerCapture(event.pointerId)
    }

    isDrawingRef.current = false
    lastPointRef.current = null
    activePointerIdRef.current = null
  }

  const handleViewportPointerDown = (event) => {
    if (disabled || !isPanMode || event.button !== 0) return

    event.preventDefault()

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }

    setIsDragging(true)
    viewportRef.current?.setPointerCapture?.(event.pointerId)
  }

  useImperativeHandle(
    ref,
    () => ({
      clearMask() {
        initializeMaskCanvas(
          layoutRef.current.naturalWidth,
          layoutRef.current.naturalHeight,
        )
        clearDisplayCanvas()
      },
      resetView,
      zoomIn() {
        updateZoom(zoom + ZOOM_STEP)
      },
      zoomOut() {
        updateZoom(zoom - ZOOM_STEP)
      },
      setZoom(value) {
        updateZoom(value)
      },
      hasMask() {
        return hasMask
      },
      exportMask() {
        return new Promise((resolve) => {
          const maskCanvas = maskCanvasRef.current

          if (!maskCanvas || !hasMask) {
            resolve(null)
            return
          }

          maskCanvas.toBlob((blob) => resolve(blob), 'image/png')
        })
      },
    }),
    [clearDisplayCanvas, hasMask, initializeMaskCanvas, resetView, updateZoom, zoom],
  )

  if (!imageFile || !imageUrl) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center bg-background-soft/70 p-6 text-center',
          fillContainer
            ? 'h-full min-h-0'
            : 'min-h-[420px] rounded-[22px] border border-dashed border-white/15',
          className,
        )}
      >
        <Text as="p" variant="body-sm" color="muted" caseMode="sentence">
          Upload a photo to start painting the removal mask.
        </Text>
      </div>
    )
  }

  const viewportClassName = fillContainer
    ? 'relative h-full min-h-0 overflow-hidden'
    : 'relative min-h-[420px] overflow-hidden'

  const viewportInnerClassName = fillContainer
    ? clsx(
        'flex h-full min-h-0 w-full items-center justify-center',
        viewportPadding > 0 && 'p-3',
      )
    : clsx(
        'flex min-h-[420px] w-full items-center justify-center',
        viewportPadding > 0 && 'p-3',
      )

  return (
    <div className={clsx(className, fillContainer && 'h-full min-h-0')}>
      <div
        className={clsx(
          'overflow-hidden bg-background-soft/70',
          fillContainer
            ? 'h-full min-h-0'
            : 'rounded-[22px] border border-dashed border-white/15',
        )}
      >
        <div
          ref={viewportRef}
          className={clsx(
            viewportClassName,
            isPanMode
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : canPaint
                ? 'cursor-crosshair'
                : 'cursor-default',
          )}
          onPointerDown={handleViewportPointerDown}
        >
          <div className={viewportInnerClassName}>
            <div
              ref={contentRef}
              className="relative inline-block select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Mask editor source"
                onLoad={measureLayout}
                className="pointer-events-none block max-w-none select-none"
                draggable={false}
              />

              <canvas
                ref={displayCanvasRef}
                className={`absolute left-0 top-0 touch-none select-none ${
                  disabled || !canPaint
                    ? 'pointer-events-none opacity-100'
                    : 'pointer-events-auto'
                } ${disabled ? 'opacity-60' : ''}`}
                style={{ touchAction: 'none' }}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                onPointerCancel={stopDrawing}
              />
            </div>
          </div>
        </div>
      </div>

      <canvas
        ref={maskCanvasRef}
        hidden
        aria-hidden="true"
        className="pointer-events-none"
        style={{ display: 'none' }}
      />
    </div>
  )
})

export default PhotoLabMaskEditor
