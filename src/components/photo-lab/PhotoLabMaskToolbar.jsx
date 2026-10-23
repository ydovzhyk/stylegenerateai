'use client'

import Button from '@/components/shared/button/Button'
import { HoverTip } from '@/components/shared/info-hint/InfoHint'
import Text from '@/components/shared/text/Text'
import {
  PHOTO_LAB_MASK_BRUSH_SIZES,
  PHOTO_LAB_MASK_ZOOM,
} from '@/components/admin/photo-lab-admin/PhotoLabMaskEditor'
import { Brush, Eraser, Minus, Plus, RotateCcw } from 'lucide-react'

export const MASK_BRUSH_OPTIONS = [
  {
    id: 'small',
    label: 'S',
    size: PHOTO_LAB_MASK_BRUSH_SIZES.small,
    hint: 'Small brush for precise edges and tiny distractions.',
  },
  {
    id: 'medium',
    label: 'M',
    size: PHOTO_LAB_MASK_BRUSH_SIZES.medium,
    hint: 'Medium brush for general object cleanup.',
  },
  {
    id: 'large',
    label: 'L',
    size: PHOTO_LAB_MASK_BRUSH_SIZES.large,
    hint: 'Large brush for quickly covering bigger areas.',
  },
]

export const DEFAULT_MASK_ZOOM_STATE = {
  zoom: PHOTO_LAB_MASK_ZOOM.min,
  zoomPercent: 100,
  canResetView: false,
}

export const MASK_TOOL_HINTS = {
  brush:
    'Draw a tight closed outline around only the object to remove, then release to fill. Use the eraser to exclude railings, shadows, and ground you want to keep.',
  eraser: 'Erase painted mask strokes to keep those areas unchanged.',
  clearMask: 'Remove the entire painted mask and start over.',
}

export default function PhotoLabMaskToolbar({
  maskEditorRef,
  maskTool,
  onMaskToolChange,
  maskPaintActive,
  onMaskPaintActiveChange,
  maskBrushSize,
  onMaskBrushSizeChange,
  maskZoomState = DEFAULT_MASK_ZOOM_STATE,
  disabled = false,
  showEraser = true,
  showTitle = true,
  title = 'Removal mask',
  onClearMask,
  className = '',
}) {
  const handleClearMask = () => {
    maskEditorRef.current?.clearMask()
    onClearMask?.()
  }

  const activateTool = (tool) => {
    onMaskToolChange(tool)
    onMaskPaintActiveChange(true)
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-background-soft/70 p-4 ${className}`}
    >
      {showTitle ? (
        <Text
          as="p"
          variant="caption"
          color="faint"
          caseMode="sentence"
          className="mb-3 uppercase tracking-[0.18em]"
        >
          {title}
        </Text>
      ) : null}

      <div
        className={`grid w-full gap-2 ${showEraser ? 'grid-cols-3' : 'grid-cols-2'}`}
      >
        <HoverTip text={MASK_TOOL_HINTS.brush} className="w-full">
          <Button
            type="button"
            variant={
              maskTool === 'brush' && maskPaintActive ? 'primary' : 'secondary'
            }
            onClick={() => activateTool('brush')}
            disabled={disabled}
            leftIcon={<Brush size={16} />}
            className="w-full whitespace-nowrap"
          >
            Brush
          </Button>
        </HoverTip>

        {showEraser ? (
          <HoverTip text={MASK_TOOL_HINTS.eraser} className="w-full">
            <Button
              type="button"
              variant={
                maskTool === 'eraser' && maskPaintActive ? 'primary' : 'secondary'
              }
              onClick={() => activateTool('eraser')}
              disabled={disabled}
              leftIcon={<Eraser size={16} />}
              className="w-full whitespace-nowrap"
            >
              Eraser
            </Button>
          </HoverTip>
        ) : null}

        <HoverTip text={MASK_TOOL_HINTS.clearMask} className="w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClearMask}
            disabled={disabled}
            className="w-full whitespace-nowrap"
          >
            Clear mask
          </Button>
        </HoverTip>
      </div>

      <div className="mt-3 flex w-full justify-center gap-2">
        {MASK_BRUSH_OPTIONS.map((option) => {
          const active = maskBrushSize === option.size

          return (
            <HoverTip key={option.id} text={option.hint}>
              <Button
                type="button"
                variant={active ? 'primary' : 'secondary'}
                onClick={() => onMaskBrushSizeChange(option.size)}
                disabled={disabled}
                className="min-w-[52px] w-auto"
              >
                {option.label}
              </Button>
            </HoverTip>
          )
        })}
      </div>

      <div className="mt-3 flex w-full items-center justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconOnly
          onClick={() => maskEditorRef.current?.zoomOut()}
          disabled={disabled || maskZoomState.zoom <= PHOTO_LAB_MASK_ZOOM.min}
          aria-label="Zoom out"
          className="shrink-0 border-white/10 bg-black/30 text-white/80 hover:border-white/10 hover:bg-black/40 hover:text-white hover:shadow-none"
          leftIcon={<Minus size={16} />}
        />

        <input
          type="range"
          min={PHOTO_LAB_MASK_ZOOM.min * 100}
          max={PHOTO_LAB_MASK_ZOOM.max * 100}
          step={PHOTO_LAB_MASK_ZOOM.step * 100}
          value={maskZoomState.zoomPercent}
          onChange={(e) =>
            maskEditorRef.current?.setZoom(Number(e.target.value) / 100)
          }
          disabled={disabled}
          aria-label="Zoom level"
          className="h-1.5 w-full min-w-[120px] max-w-[220px] cursor-pointer appearance-none rounded-full bg-white/10 accent-[#7c5cff] disabled:cursor-not-allowed disabled:opacity-40"
        />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconOnly
          onClick={() => maskEditorRef.current?.zoomIn()}
          disabled={disabled || maskZoomState.zoom >= PHOTO_LAB_MASK_ZOOM.max}
          aria-label="Zoom in"
          className="shrink-0 border-white/10 bg-black/30 text-white/80 hover:border-white/10 hover:bg-black/40 hover:text-white hover:shadow-none"
          leftIcon={<Plus size={16} />}
        />

        <span className="min-w-[48px] shrink-0 text-center text-xs font-medium text-white/70">
          {maskZoomState.zoomPercent}%
        </span>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconOnly
          onClick={() => maskEditorRef.current?.resetView()}
          disabled={disabled || !maskZoomState.canResetView}
          aria-label="Reset zoom"
          className="shrink-0 border-white/10 bg-black/30 text-white/80 hover:border-white/10 hover:bg-black/40 hover:text-white hover:shadow-none"
          leftIcon={<RotateCcw size={15} />}
        />
      </div>
    </div>
  )
}
