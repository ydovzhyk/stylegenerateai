'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ImagePlus, Loader2, Maximize2, Move, Trash2, Upload } from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'react-toastify'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import { PhotoStackNavButtons } from '@/components/shared/photo-stack-carousel/PhotoStackCarouselControls'
import useGenerationPlanAccess from '@/hooks/useGenerationPlanAccess'
import { axiosGenerateOnTheWall } from '@/services/api/on-the-wall'
import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'

const MAX_WALLS = 3
const WALL_ROLES = ['left', 'center', 'right']
const WALL_LABELS = ['Left wall', 'Center wall', 'Right wall']
/** Interactive preview always bills/generates at Standard under the hood. */
const BUILD_ROOM_PHOTO_QUALITY = 'standard'
const WALL_SIZE_MIN_CM = 50
const WALL_SIZE_MAX_CM = 2000

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

function SourceDot({ uploaded }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'h-4 w-4 shrink-0 rounded-full border',
        uploaded
          ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_#12141c]'
          : 'border-white/40 bg-transparent',
      )}
    />
  )
}

function SizeField({ id, label, value, onChange, suffix, disabled }) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <Text as="span" variant="caption" color="faint" caseMode="sentence">
        {label}
      </Text>
      <span className="flex h-10 min-h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-0">
        <input
          id={id}
          type="number"
          min={WALL_SIZE_MIN_CM}
          max={WALL_SIZE_MAX_CM}
          inputMode="decimal"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none disabled:opacity-55"
        />
        <Text as="span" variant="caption" color="faint">
          {suffix}
        </Text>
      </span>
    </label>
  )
}

function parseWallSizeCm(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  return numeric
}

function wallSizesAreValid(widthCm, heightCm) {
  if (widthCm == null && heightCm == null) return true
  if (widthCm == null || heightCm == null) return false
  return (
    widthCm >= WALL_SIZE_MIN_CM &&
    widthCm <= WALL_SIZE_MAX_CM &&
    heightCm >= WALL_SIZE_MIN_CM &&
    heightCm <= WALL_SIZE_MAX_CM
  )
}

/** Same visual height band as Photo Lab upload cards (~1/3-col × 4/5), not half-page tall. */
const PREVIEW_MEDIA_CLASS =
  'relative h-[260px] w-full overflow-hidden bg-black/25 sm:h-[300px]'

function PreviewFrame({
  emptyLabel,
  emptyHint,
  src,
  alt,
  eyebrow,
  onEmptyClick,
  onChangeClick,
  onPreview,
  overlay,
  footer,
  className,
}) {
  return (
    <div
      className={clsx(
        'group overflow-hidden rounded-[20px] border border-white/10',
        className,
      )}
    >
      <div className={PREVIEW_MEDIA_CLASS}>
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] bg-gradient-to-b from-black/55 via-black/15 to-transparent px-4 pb-10 pt-3">
              <Text
                as="p"
                variant="caption"
                color="soft"
                caseMode="sentence"
                className="uppercase tracking-[0.16em]"
              >
                {eyebrow}
              </Text>
            </div>
            {overlay}
            {onPreview ? (
              <button
                type="button"
                onClick={onPreview}
                className="absolute right-3 top-3 z-[4] hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:bg-black/40 hover:text-white group-hover:opacity-100 lg:inline-flex"
                aria-label="Open image preview"
              >
                <Maximize2 size={15} />
              </button>
            ) : null}
            {onChangeClick ? (
              <div className="absolute bottom-3 left-3 z-[4]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onChangeClick}
                  className="h-[38px] rounded-full border-white/10 bg-black/55 px-4 backdrop-blur-sm hover:bg-black/70"
                >
                  Change photo
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={onEmptyClick}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center transition hover:bg-white/[0.03]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
              <ImagePlus size={24} />
            </span>
            <Text as="span" variant="body" color="white" caseMode="sentence">
              {emptyLabel}
            </Text>
            {emptyHint ? (
              <Text
                as="span"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="max-w-[240px]"
              >
                {emptyHint}
              </Text>
            ) : null}
          </button>
        )}
      </div>
      {footer}
    </div>
  )
}

const ROOM_STAGE_CLASS =
  'relative flex h-[260px] w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/30 sm:h-[320px]'

function PlacementStage({
  art,
  placement,
  onPlacementChange,
  roomPreviewUrl,
  isGenerating,
  onPreview,
}) {
  const stageRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    const onMove = (event) => {
      const drag = dragRef.current
      const stage = stageRef.current
      if (!drag || !stage || !roomPreviewUrl) return

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
  }, [onPlacementChange, placement.x, roomPreviewUrl])

  if (isGenerating) {
    return (
      <div className={`${ROOM_STAGE_CLASS} flex-col gap-3 border-solid px-6 text-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-soft" />
        <Text as="p" variant="body-sm" color="soft" caseMode="sentence">
          Building your room visualization…
        </Text>
      </div>
    )
  }

  if (!roomPreviewUrl) {
    return (
      <div
        className={`${ROOM_STAGE_CLASS} border-dashed border-white/12 bg-white/[0.03] px-6 text-center`}
      >
        <Text as="p" variant="body-sm" color="faint" caseMode="sentence">
          After Build room, the room panorama appears here — not your wall
          uploads.
        </Text>
      </div>
    )
  }

  return (
    <div ref={stageRef} className={`group ${ROOM_STAGE_CLASS}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={roomPreviewUrl}
        alt="Room visualization"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {onPreview ? (
        <button
          type="button"
          onClick={onPreview}
          className="absolute right-3 top-3 z-[4] hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:bg-black/40 hover:text-white group-hover:opacity-100 lg:inline-flex"
          aria-label="Open image preview"
        >
          <Maximize2 size={15} />
        </button>
      ) : null}

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
      ) : null}

      {!art ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-10">
          <Text as="p" variant="caption" color="soft" caseMode="sentence">
            Room ready. Add artwork above to preview placement (AI blend comes
            next).
          </Text>
        </div>
      ) : null}
    </div>
  )
}

export default function OnTheWallWorkspace() {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)

  const { creditCost, planHint } = useGenerationPlanAccess({
    productKey: 'on_the_wall',
  })

  const [walls, setWalls] = useState(() => Array(MAX_WALLS).fill(null))
  const [selectedWallIndex, setSelectedWallIndex] = useState(0)
  const [art, setArt] = useState(null)
  const [placement, setPlacement] = useState({ x: 50, y: 42, width: 28 })
  const [pendingWallIndex, setPendingWallIndex] = useState(0)
  const [wallWidthCm, setWallWidthCm] = useState('')
  const [wallHeightCm, setWallHeightCm] = useState('')
  /** Kept after Build room as reference for later painting-size math. */
  const [roomWallSize, setRoomWallSize] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [roomPreviewUrl, setRoomPreviewUrl] = useState('')
  const [generationJobId, setGenerationJobId] = useState('')
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })
  const wallInputRef = useRef(null)
  const artInputRef = useRef(null)

  const parsedWallWidthCm = parseWallSizeCm(wallWidthCm)
  const parsedWallHeightCm = parseWallSizeCm(wallHeightCm)
  const wallSizeValid = wallSizesAreValid(
    parsedWallWidthCm,
    parsedWallHeightCm,
  )

  const openImagePreview = ({ src, alt, title }) => {
    if (!src) return
    const canOpenModal =
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches
    if (!canOpenModal) return
    setPreviewModal({ open: true, src, alt, title })
  }

  const closeImagePreview = () => {
    setPreviewModal({ open: false, src: '', alt: '', title: '' })
  }

  useEffect(() => {
    return () => {
      walls.forEach((wall) => revokeUrl(wall?.previewUrl))
      revokeUrl(art?.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filledIndexes = useMemo(
    () =>
      walls
        .map((wall, index) => (wall ? index : -1))
        .filter((index) => index >= 0),
    [walls],
  )

  const activeWall = walls[selectedWallIndex] || null
  const carouselPos = filledIndexes.indexOf(selectedWallIndex)
  const canGoLeft = carouselPos > 0
  const canGoRight =
    carouselPos >= 0 && carouselPos < filledIndexes.length - 1
  const canBuildRoom =
    filledIndexes.length > 0 && !isGenerating && wallSizeValid

  const openWallPicker = (index) => {
    setPendingWallIndex(index)
    setSelectedWallIndex(index)
    wallInputRef.current?.click()
  }

  const handleWallSourceClick = (index) => {
    if (walls[index]) {
      setSelectedWallIndex(index)
      return
    }
    openWallPicker(index)
  }

  const handleWallUpload = (file) => {
    const next = readImageFile(file)
    if (!next) return
    const index = pendingWallIndex
    setWalls((prev) => {
      const copy = [...prev]
      revokeUrl(copy[index]?.previewUrl)
      copy[index] = next
      return copy
    })
    setSelectedWallIndex(index)
    setRoomPreviewUrl('')
    setGenerationJobId('')
    setRoomWallSize(null)
  }

  const handleWallClear = (index) => {
    setWalls((prev) => {
      const copy = [...prev]
      revokeUrl(copy[index]?.previewUrl)
      copy[index] = null
      return copy
    })
    const remaining = filledIndexes.filter((item) => item !== index)
    setSelectedWallIndex(remaining[0] ?? 0)
    setRoomPreviewUrl('')
    setGenerationJobId('')
    setRoomWallSize(null)
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

  const goWallLeft = () => {
    if (!canGoLeft) return
    setSelectedWallIndex(filledIndexes[carouselPos - 1])
  }

  const goWallRight = () => {
    if (!canGoRight) return
    setSelectedWallIndex(filledIndexes[carouselPos + 1])
  }

  const handleBuildRoom = async () => {
    if (!canBuildRoom) return

    if (!wallSizeValid) {
      toast.error(
        `Enter both wall width and height between ${WALL_SIZE_MIN_CM} and ${WALL_SIZE_MAX_CM} cm, or leave both empty.`,
      )
      return
    }

    const ordered = filledIndexes.map((index) => ({
      index,
      role: WALL_ROLES[index],
      wall: walls[index],
    }))

    const formData = new FormData()
    formData.append('photoQuality', BUILD_ROOM_PHOTO_QUALITY)
    formData.append(
      'wallRoles',
      JSON.stringify(ordered.map((item) => item.role)),
    )
    ordered.forEach((item) => {
      formData.append(
        'walls',
        item.wall.file,
        item.wall.file.name || `${item.role}.jpg`,
      )
    })

    if (parsedWallWidthCm != null && parsedWallHeightCm != null) {
      formData.append('wallWidthCm', String(parsedWallWidthCm))
      formData.append('wallHeightCm', String(parsedWallHeightCm))
    }

    if (!isLogin && visitorId) {
      formData.append('visitorId', visitorId)
    }

    setIsGenerating(true)
    setRoomPreviewUrl('')
    setGenerationJobId('')

    try {
      const data = await axiosGenerateOnTheWall(formData)
      const nextPreview = data?.previewUrl || ''
      if (!nextPreview) {
        throw new Error('Room preview is missing')
      }
      setRoomPreviewUrl(nextPreview)
      setGenerationJobId(String(data?.jobId || '').trim())
      const nextWallSize =
        parsedWallWidthCm != null && parsedWallHeightCm != null
          ? {
              widthCm: parsedWallWidthCm,
              heightCm: parsedWallHeightCm,
            }
          : data?.result?.wallSize ||
            data?.wallSize ||
            null
      setRoomWallSize(nextWallSize)
      if (isLogin || visitorId) dispatch(getGenerationUsage())
      toast.success('Room visualization ready')
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to build room. Please try again.'
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-6">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6">
          <Text as="h2" variant="h3" color="white" caseMode="sentence">
            1. Room walls
          </Text>
          <Text
            as="p"
            variant="body-sm"
            color="muted"
            caseMode="sentence"
            className="mt-2"
          >
            Upload any combination of Left, Center, and Right walls. Confirm
            when ready to build the room view.
          </Text>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {WALL_LABELS.map((label, index) => {
              const uploaded = Boolean(walls[index])
              const selected = selectedWallIndex === index && uploaded

              return (
                <Button
                  key={label}
                  type="button"
                  variant="secondary"
                  shape="soft"
                  active={selected || uploaded}
                  fullWidth
                  onClick={() => handleWallSourceClick(index)}
                  className="h-10 min-h-10 justify-start gap-3 px-4 font-medium"
                  leftIcon={<SourceDot uploaded={uploaded} />}
                >
                  {label}
                </Button>
              )
            })}
          </div>

          <input
            ref={wallInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handleWallUpload(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          <div className="mt-4">
            <PreviewFrame
              src={activeWall?.previewUrl}
              alt={WALL_LABELS[selectedWallIndex]}
              eyebrow={WALL_LABELS[selectedWallIndex]}
              emptyLabel="Upload a wall photo"
              emptyHint="Any wall slot works. Missing sides will be drawn schematically."
              onEmptyClick={() => openWallPicker(selectedWallIndex || 0)}
              onChangeClick={
                activeWall
                  ? () => openWallPicker(selectedWallIndex)
                  : undefined
              }
              onPreview={
                activeWall
                  ? () =>
                      openImagePreview({
                        src: activeWall.previewUrl,
                        alt: WALL_LABELS[selectedWallIndex],
                        title: WALL_LABELS[selectedWallIndex],
                      })
                  : undefined
              }
              overlay={
                filledIndexes.length > 1 ? (
                  <PhotoStackNavButtons
                    canGoLeft={canGoLeft}
                    canGoRight={canGoRight}
                    onLeft={goWallLeft}
                    onRight={goWallRight}
                  />
                ) : null
              }
              footer={
                activeWall ? (
                  <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/40 px-3 py-2.5">
                    <Text
                      as="p"
                      variant="caption"
                      color="soft"
                      caseMode="sentence"
                    >
                      {WALL_LABELS[selectedWallIndex]}
                      {filledIndexes.length > 1
                        ? ` · ${carouselPos + 1}/${filledIndexes.length}`
                        : ''}
                    </Text>
                    <button
                      type="button"
                      onClick={() => handleWallClear(selectedWallIndex)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/65 transition hover:border-rose-300/30 hover:text-rose-200"
                    >
                      <Trash2 size={12} />
                      Clear
                    </button>
                  </div>
                ) : null
              }
            />
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <div>
              <Text as="p" variant="body" color="white" caseMode="sentence">
                Center wall size
              </Text>
              <Text
                as="p"
                variant="caption"
                color="faint"
                caseMode="sentence"
                className="mt-1"
              >
                Optional. Helps keep wall proportions and later estimate
                painting size on the wall.
              </Text>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <SizeField
                  id="wall-width-cm"
                  label="Width"
                  value={wallWidthCm}
                  suffix="cm"
                  disabled={isGenerating}
                  onChange={setWallWidthCm}
                />
                <SizeField
                  id="wall-height-cm"
                  label="Height"
                  value={wallHeightCm}
                  suffix="cm"
                  disabled={isGenerating}
                  onChange={setWallHeightCm}
                />
              </div>
              {!wallSizeValid ? (
                <Text
                  as="p"
                  variant="caption"
                  color="faint"
                  caseMode="sentence"
                  className="mt-2 text-rose-200/80"
                >
                  Enter both width and height ({WALL_SIZE_MIN_CM}–
                  {WALL_SIZE_MAX_CM} cm), or clear both fields.
                </Text>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                {planHint ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="faint"
                    caseMode="sentence"
                  >
                    {planHint}
                  </Text>
                ) : null}
                {!filledIndexes.length ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="faint"
                    caseMode="sentence"
                    className={planHint ? 'mt-1' : undefined}
                  >
                    Add at least one wall photo to enable Build room.
                  </Text>
                ) : null}
                {roomWallSize ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="faint"
                    caseMode="sentence"
                    className="mt-1"
                  >
                    Reference wall for sizing: {roomWallSize.widthCm} ×{' '}
                    {roomWallSize.heightCm} cm
                  </Text>
                ) : null}
              </div>

              <Button
                type="button"
                variant="primary"
                disabled={!canBuildRoom}
                onClick={handleBuildRoom}
                className="min-h-11 shrink-0 px-5"
                leftIcon={
                  isGenerating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null
                }
              >
                {isGenerating
                  ? 'Building…'
                  : creditCost != null
                    ? `Build room · ${creditCost} cr`
                    : 'Build room'}
              </Button>
            </div>
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
            className="mt-2"
          >
            Upload a picture now for local placement preview. Gallery pick and
            AI blend come next.
          </Text>

          <div className="mt-5 flex flex-wrap items-stretch gap-2">
            <Button
              type="button"
              variant="secondary"
              shape="soft"
              onClick={() => artInputRef.current?.click()}
              className="h-10 min-h-10 justify-start gap-3 px-4 font-medium"
              leftIcon={<Upload size={16} />}
            >
              Upload artwork
            </Button>
            <Button
              type="button"
              variant="secondary"
              shape="soft"
              disabled
              className="h-10 min-h-10 justify-start gap-3 px-4 font-medium"
              leftIcon={<ImagePlus size={16} />}
            >
              From gallery (soon)
            </Button>
            {art ? (
              <Button
                type="button"
                variant="ghost"
                shape="soft"
                onClick={() => {
                  setArt((prev) => {
                    revokeUrl(prev?.previewUrl)
                    return null
                  })
                }}
                className="h-10 min-h-10 justify-start gap-3 px-4 font-medium text-white/70 hover:text-rose-200"
                leftIcon={<Trash2 size={16} />}
              >
                Remove
              </Button>
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

          <div className="mt-4">
            <PreviewFrame
              src={art?.previewUrl}
              alt="Artwork"
              eyebrow={art ? `Artwork · ${art.source}` : 'Artwork'}
              emptyLabel="Upload artwork"
              emptyHint="Optional for now — place it on the built room below."
              onEmptyClick={() => artInputRef.current?.click()}
              onChangeClick={
                art ? () => artInputRef.current?.click() : undefined
              }
              onPreview={
                art
                  ? () =>
                      openImagePreview({
                        src: art.previewUrl,
                        alt: 'Artwork',
                        title: 'Artwork',
                      })
                  : undefined
              }
            />
          </div>
        </section>
      </div>

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
              After Build room, the room visualization appears here. Drag
              artwork for a local preview — AI fit into lighting comes next.
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
            art={art}
            placement={placement}
            onPlacementChange={handlePlacementChange}
            roomPreviewUrl={roomPreviewUrl}
            isGenerating={isGenerating}
            onPreview={
              roomPreviewUrl
                ? () =>
                    openImagePreview({
                      src: roomPreviewUrl,
                      alt: 'Room visualization',
                      title: 'Room visualization',
                    })
                : undefined
            }
          />
        </div>

        {roomPreviewUrl && generationJobId ? (
          <Text
            as="p"
            variant="caption"
            color="faint"
            caseMode="sentence"
            className="mt-3"
          >
            Room built from {filledIndexes.length} wall
            {filledIndexes.length === 1 ? '' : 's'}. Missing sides were drawn
            schematically when needed.
          </Text>
        ) : null}
      </section>

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closeImagePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />
    </div>
  )
}
