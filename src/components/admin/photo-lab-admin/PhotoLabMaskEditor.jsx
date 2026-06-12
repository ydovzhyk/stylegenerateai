'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import Text from '@/components/shared/text/Text'

export const PHOTO_LAB_MASK_BRUSH_SIZES = {
  small: 4,
  medium: 8,
  large: 14,
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
    disabled = false,
    className = '',
    onHasMaskChange,
  },
  ref,
) {
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const displayCanvasRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const layoutRef = useRef({
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    scale: 1,
  })
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const activePointerIdRef = useRef(null)

  const [imageUrl, setImageUrl] = useState('')
  const [hasMask, setHasMask] = useState(false)

  const updateHasMask = useCallback(
    (nextValue) => {
      setHasMask(nextValue)
      onHasMaskChange?.(nextValue)
    },
    [onHasMaskChange],
  )

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
    const container = containerRef.current
    const image = imageRef.current
    const displayCanvas = displayCanvasRef.current

    if (!container || !image || !displayCanvas) return
    if (!image.naturalWidth || !image.naturalHeight) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    const scale = Math.min(
      containerWidth / naturalWidth,
      containerHeight / naturalHeight,
    )
    const width = Math.max(1, Math.round(naturalWidth * scale))
    const height = Math.max(1, Math.round(naturalHeight * scale))
    const offsetX = Math.round((containerWidth - width) / 2)
    const offsetY = Math.round((containerHeight - height) / 2)
    const previousLayout = layoutRef.current
    const sizeChanged =
      previousLayout.width !== width || previousLayout.height !== height

    layoutRef.current = {
      width,
      height,
      offsetX,
      offsetY,
      naturalWidth,
      naturalHeight,
      scale,
    }

    displayCanvas.style.left = `${offsetX}px`
    displayCanvas.style.top = `${offsetY}px`
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
  }, [clearDisplayCanvas, initializeMaskCanvas])

  useEffect(() => {
    if (!imageFile) {
      setImageUrl('')
      updateHasMask(false)
      return
    }

    const nextUrl = URL.createObjectURL(imageFile)
    setImageUrl(nextUrl)

    return () => {
      URL.revokeObjectURL(nextUrl)
    }
  }, [imageFile, updateHasMask])

  useEffect(() => {
    if (!imageUrl) return

    const container = containerRef.current

    if (!container) return

    measureLayout()

    const resizeObserver = new ResizeObserver(() => {
      measureLayout()
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [imageUrl, measureLayout])

  const getPointerPosition = useCallback(
    (event) => {
      const displayCanvas = displayCanvasRef.current
      const layout = layoutRef.current

      if (!displayCanvas || !layout.scale) return null

      const rect = displayCanvas.getBoundingClientRect()
      const displayX = event.clientX - rect.left
      const displayY = event.clientY - rect.top

      if (
        displayX < 0 ||
        displayY < 0 ||
        displayX > rect.width ||
        displayY > rect.height
      ) {
        return null
      }

      const scaleX = layout.naturalWidth / rect.width
      const scaleY = layout.naturalHeight / rect.height

      return {
        displayX,
        displayY,
        maskX: displayX * scaleX,
        maskY: displayY * scaleY,
        displayRadius: brushSize / 2,
        maskRadius: (brushSize / 2) * scaleX,
      }
    },
    [brushSize],
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

  const handlePointerDown = (event) => {
    if (disabled) return

    event.preventDefault()
    isDrawingRef.current = true
    lastPointRef.current = null
    activePointerIdRef.current = event.pointerId
    displayCanvasRef.current?.setPointerCapture(event.pointerId)

    const point = getPointerPosition(event)

    if (point) {
      paintStroke(point)
    }
  }

  const handlePointerMove = (event) => {
    if (
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
    [clearDisplayCanvas, hasMask, initializeMaskCanvas],
  )

  if (!imageFile || !imageUrl) {
    return (
      <div
        className={`flex min-h-[420px] items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-background-soft/70 p-6 text-center ${className}`}
      >
        <Text as="p" variant="body-sm" color="muted" caseMode="sentence">
          Upload a photo to start painting the removal mask.
        </Text>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative min-h-[420px] overflow-hidden rounded-[22px] border border-dashed border-white/15 bg-background-soft/70"
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Mask editor source"
          onLoad={measureLayout}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          draggable={false}
        />

        <canvas
          ref={displayCanvasRef}
          className={`absolute touch-none select-none ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />

        <canvas ref={maskCanvasRef} className="hidden" aria-hidden="true" />
      </div>
    </div>
  )
})

export default PhotoLabMaskEditor
