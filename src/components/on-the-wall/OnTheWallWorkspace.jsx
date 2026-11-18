'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Move, Trash2, Upload } from 'lucide-react'
import Text from '@/components/shared/text/Text'

const MAX_WALLS = 3
const WALL_LABELS = ['Left wall', 'Center wall', 'Right wall']

function revokeUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function readImageFile(file) {
  if (!file || !String(file.type || '').startsWith('image/')) return null
  return {
    file,
    previewUrl: URL.createObjectURL(file),
  }
}

function WallSlot({
  index,
  wall,
  selected,
  onSelect,
  onUpload,
  onClear,
}) {
  const inputRef = useRef(null)

  return (
    <div
      className={
        selected
          ? 'rounded-[22px] border border-primary/45 bg-primary/10 p-3'
          : 'rounded-[22px] border border-white/10 bg-white/[0.03] p-3'
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Text as="p" variant="caption" color="soft" caseMode="sentence">
          {WALL_LABELS[index] || `Wall ${index + 1}`}
        </Text>
        {wall ? (
          <button
            type="button"
            onClick={() => onClear(index)}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/60 transition hover:border-rose-300/30 hover:text-rose-200"
          >
            <Trash2 size={12} />
            Clear
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          if (wall) onSelect(index)
          else inputRef.current?.click()
        }}
        className="group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[16px] border border-dashed border-white/15 bg-black/20"
      >
        {wall ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={wall.previewUrl}
            alt={WALL_LABELS[index]}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 px-3 text-center text-white/45">
            <Upload size={20} />
            <span className="text-xs">Upload wall photo</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          const next = readImageFile(file)
          if (next) onUpload(index, next)
          event.target.value = ''
        }}
      />

      {wall ? (
        <button
          type="button"
          onClick={() => onSelect(index)}
          className="mt-2 w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-cyan-400/35"
        >
          {selected ? 'Selected for placement' : 'Place art on this wall'}
        </button>
      ) : null}
    </div>
  )
}

function PlacementStage({ wall, art, placement, onPlacementChange }) {
  const stageRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    const onMove = (event) => {
      const drag = dragRef.current
      const stage = stageRef.current
      if (!drag || !stage) return

      const rect = stage.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      if (drag.mode === 'move') {
        const nextX =
          ((event.clientX - rect.left) / rect.width) * 100 - drag.offsetX
        const nextY =
          ((event.clientY - rect.top) / rect.height) * 100 - drag.offsetY
        onPlacementChange({
          x: Math.min(85, Math.max(5, nextX)),
          y: Math.min(85, Math.max(5, nextY)),
        })
        return
      }

      if (drag.mode === 'resize') {
        const widthPx = Math.max(
          48,
          event.clientX - rect.left - (placement.x / 100) * rect.width,
        )
        const nextWidth = (widthPx / rect.width) * 100
        onPlacementChange({
          width: Math.min(70, Math.max(12, nextWidth)),
        })
      }
    }

    const onUp = () => {
      dragRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [onPlacementChange, placement.x])

  if (!wall) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] px-6 text-center">
        <Text as="p" variant="body-sm" color="faint" caseMode="sentence">
          Upload at least one wall photo to start placing your artwork.
        </Text>
      </div>
    )
  }

  return (
    <div
      ref={stageRef}
      className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-black/30"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={wall.previewUrl}
        alt="Selected wall"
        className="h-full min-h-[320px] w-full object-cover"
      />

      {art ? (
        <div
          className="absolute cursor-move touch-none"
          style={{
            left: `${placement.x}%`,
            top: `${placement.y}%`,
            width: `${placement.width}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onPointerDown={(event) => {
            event.preventDefault()
            const stage = stageRef.current
            if (!stage) return
            const rect = stage.getBoundingClientRect()
            dragRef.current = {
              mode: 'move',
              offsetX:
                ((event.clientX - rect.left) / rect.width) * 100 - placement.x,
              offsetY:
                ((event.clientY - rect.top) / rect.height) * 100 - placement.y,
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art.previewUrl}
            alt="Artwork"
            className="pointer-events-none w-full rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/40"
            draggable={false}
          />
          <button
            type="button"
            aria-label="Resize artwork"
            className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              dragRef.current = { mode: 'resize' }
            }}
          >
            <Move size={12} />
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 px-6 text-center">
          <Text as="p" variant="body-sm" color="soft" caseMode="sentence">
            Add artwork from upload or gallery, then drag it on the wall.
          </Text>
        </div>
      )}
    </div>
  )
}

export default function OnTheWallWorkspace() {
  const [walls, setWalls] = useState(() => Array(MAX_WALLS).fill(null))
  const [selectedWallIndex, setSelectedWallIndex] = useState(0)
  const [art, setArt] = useState(null)
  const [placement, setPlacement] = useState({ x: 50, y: 42, width: 28 })
  const artInputRef = useRef(null)

  useEffect(() => {
    return () => {
      walls.forEach((wall) => revokeUrl(wall?.previewUrl))
      revokeUrl(art?.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filledWalls = walls.filter(Boolean)
  const activeWall = walls[selectedWallIndex] || filledWalls[0] || null

  const handleWallUpload = (index, next) => {
    setWalls((prev) => {
      const copy = [...prev]
      revokeUrl(copy[index]?.previewUrl)
      copy[index] = next
      return copy
    })
    setSelectedWallIndex(index)
  }

  const handleWallClear = (index) => {
    setWalls((prev) => {
      const copy = [...prev]
      revokeUrl(copy[index]?.previewUrl)
      copy[index] = null
      return copy
    })
  }

  const handleArtUpload = (file) => {
    const next = readImageFile(file)
    if (!next) return
    setArt((prev) => {
      revokeUrl(prev?.previewUrl)
      return { ...next, source: 'upload' }
    })
  }

  const handlePlacementChange = (patch) => {
    setPlacement((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6">
        <Text as="h2" variant="h3" color="white" caseMode="sentence">
          1. Room walls
        </Text>
        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2 max-w-2xl"
        >
          Upload one wall to start, or up to three walls for a future prism /
          panorama view. Today placement works on the selected wall.
        </Text>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {walls.map((wall, index) => (
            <WallSlot
              key={WALL_LABELS[index]}
              index={index}
              wall={wall}
              selected={selectedWallIndex === index && Boolean(wall)}
              onSelect={setSelectedWallIndex}
              onUpload={handleWallUpload}
              onClear={handleWallClear}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6">
        <Text as="h2" variant="h3" color="white" caseMode="sentence">
          2. Artwork
        </Text>
        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2 max-w-2xl"
        >
          Choose a picture from your gallery later, or upload one now to test
          placement.
        </Text>

        <div className="mt-5 flex flex-wrap items-stretch gap-3">
          <button
            type="button"
            onClick={() => artInputRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-cyan-400/35"
          >
            <Upload size={16} />
            Upload artwork
          </button>
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/40"
          >
            <ImagePlus size={16} />
            From gallery (soon)
          </button>
          {art ? (
            <button
              type="button"
              onClick={() => {
                setArt((prev) => {
                  revokeUrl(prev?.previewUrl)
                  return null
                })
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold text-white/70 transition hover:border-rose-300/30 hover:text-rose-200"
            >
              <Trash2 size={16} />
              Remove artwork
            </button>
          ) : null}
        </div>

        <input
          ref={artInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            handleArtUpload(event.target.files?.[0])
            event.target.value = ''
          }}
        />

        {art ? (
          <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={art.previewUrl}
              alt="Selected artwork"
              className="h-16 w-16 rounded-lg object-cover"
            />
            <Text as="p" variant="body-sm" color="soft" caseMode="sentence">
              Artwork ready ({art.source}). Drag and resize it on the wall
              preview below.
            </Text>
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Text as="h2" variant="h3" color="white" caseMode="sentence">
              3. Place on the wall
            </Text>
            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-2 max-w-2xl"
            >
              Drag to move, use the corner handle to resize. AI fit into the
              room lighting comes next.
            </Text>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/40"
          >
            Place in room (soon)
          </button>
        </div>

        <div className="mt-5">
          <PlacementStage
            wall={activeWall}
            art={art}
            placement={placement}
            onPlacementChange={handlePlacementChange}
          />
        </div>

        {filledWalls.length > 1 ? (
          <Text
            as="p"
            variant="caption"
            color="faint"
            caseMode="sentence"
            className="mt-3"
          >
            {filledWalls.length} walls uploaded. Panorama / prism stitching is
            planned next — for now edit placement on the selected wall.
          </Text>
        ) : null}
      </section>
    </div>
  )
}
