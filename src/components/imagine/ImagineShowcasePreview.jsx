'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import clsx from 'clsx'
import Photo from '@/components/shared/photo/Photo'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Trash2, X } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import ShowcasePreviewImage from '@/components/shared/showcase-preview-image/ShowcasePreviewImage'
import PreviewBadge, {
  PHOTO_OVERLAY_TEXT_OUTLINE,
} from '@/components/shared/preview-badge/PreviewBadge'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'
import { IMAGINE_MODES, PAINTING_TECHNIQUES } from '@/constants/imagine'
import { useTranslate } from '@/utils/translate/translate'
import {
  collectRotationPreloadUrls,
  usePreloadImages,
} from '@/utils/preload-images'
import { getUser } from '@/store/auth/auth-selectors'
import { deleteImagineTemplate, getImagineTemplates } from '@/store/imagine/imagine-operations'
import {
  getImagineTemplatesLoading,
  getImagineTemplatesState,
} from '@/store/imagine/imagine-selectors'

const CARD_ROTATE_MS = 8200

function useRotatingIndex(length, delay, resetKey) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [resetKey])

  useEffect(() => {
    if (length <= 0) {
      setIndex(0)
      return
    }

    setIndex((prev) => (prev >= length ? 0 : prev))
  }, [length])

  useEffect(() => {
    if (length <= 1) return

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % length)
    }, delay)

    return () => window.clearInterval(timer)
  }, [length, delay, resetKey])

  return [index, setIndex]
}

function getPaintingLookLabel(techniqueId = '') {
  const id = String(techniqueId || '').trim()
  if (!id) return ''
  return PAINTING_TECHNIQUES.find((item) => item.id === id)?.label || ''
}

function buildDisplayPrompt({
  templatePrompt = '',
  techniqueId = '',
  homeStyle = '',
  fallback = '',
} = {}) {
  const prompt = String(templatePrompt || '').trim()
  const lookLabel = getPaintingLookLabel(techniqueId)
  const lookLine = lookLabel ? `Look: ${lookLabel}` : ''
  const styleLine = String(homeStyle || '').trim()
    ? `Style: ${String(homeStyle).trim()}`
    : ''

  return (
    [lookLine, styleLine, prompt].filter(Boolean).join('\n') ||
    String(fallback || '').trim()
  )
}

function mapTemplate(template) {
  const modeId = String(template?.mode || '').trim()

  return {
    id: template?._id || `${modeId}-${template?.title}`,
    templateId: template?._id || null,
    modeId,
    title: String(template?.title || '').trim(),
    prompt: String(template?.prompt || '').trim(),
    technique: String(template?.technique || '').trim(),
    homeStyle: String(template?.homeStyle || '').trim(),
    afterSrc: String(template?.resultImageUrl || '').trim(),
    faceSrc: String(template?.referenceImageUrl || '').trim(),
    exampleSrc: String(template?.exampleImageUrl || '').trim(),
  }
}

function buildItems(templatesByMode = {}, modeId = '') {
  const modes = modeId
    ? IMAGINE_MODES.filter((mode) => mode.id === modeId)
    : IMAGINE_MODES

  return modes.flatMap((mode) =>
    (templatesByMode[mode.id] || []).map((template) => mapTemplate(template)),
  )
}

function ModeChip({ mode, active, pinned, onClick }) {
  const label = useTranslate(mode.title, { caseMode: 'title' })

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1.5 text-xs transition',
        active
          ? 'border-primary/50 bg-primary/15 text-white'
          : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-cyan-400/30 hover:text-white',
        pinned && 'ring-1 ring-primary/30',
      )}
    >
      {label}
    </button>
  )
}

function PhotoInset({
  src,
  alt,
  label,
  onClick,
  ariaLabel,
  priority = false,
}) {
  if (!src) return null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || `Open ${label || 'photo'} preview`}
      className="absolute bottom-3 right-3 z-[4] w-[30%] cursor-zoom-in overflow-hidden rounded-2xl border border-white/25 bg-black/40 shadow-[0_10px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:bottom-4 sm:right-4"
    >
      <div className="relative aspect-[4/5] w-full">
        <Photo
          src={src}
          alt={alt || label || 'Photo'}
          fill
          sizes="120px"
          priority={priority}
          className="object-[center_18%]"
        />
        {label ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-1.5 py-1.5">
            <span
              className={clsx(
                'block truncate text-center text-[9px] uppercase tracking-[0.14em] text-white/85',
                PHOTO_OVERLAY_TEXT_OUTLINE,
              )}
            >
              {label}
            </span>
          </div>
        ) : null}
      </div>
    </button>
  )
}

function SourceCard({
  src,
  alt,
  title,
  prompt,
  exampleSrc,
  exampleLabel,
  priority = false,
  onOpenPreview,
  openPreviewAriaLabel,
  onOpenExamplePreview,
  openExampleAriaLabel,
}) {
  const reducedMotion = useReducedMotion()
  const hasImage = Boolean(src)
  const hasCopy = Boolean(title || prompt)

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={clsx(
        'group relative w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm',
        hasImage && 'cursor-zoom-in',
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(160deg,rgba(124,92,255,0.18)_0%,rgba(8,10,18,0.2)_42%,rgba(3,6,18,0.72)_100%)]">
        {hasImage && onOpenPreview ? (
          <button
            type="button"
            onClick={onOpenPreview}
            aria-label={openPreviewAriaLabel || 'Open photo preview'}
            className="absolute inset-0 z-[1] cursor-zoom-in"
          />
        ) : null}
        {hasImage ? (
          <ShowcasePreviewImage
            src={src}
            alt={alt}
            imageKey={src}
            priority={priority}
            objectPositionClassName="object-center"
          />
        ) : null}
        {hasCopy ? (
          <div
            className={clsx(
              'absolute z-[3] overflow-y-auto rounded-2xl border border-white/20 bg-black/55 px-3 py-2.5 backdrop-blur-md',
              hasImage
                ? // Reference photo: keep top panel + scroll, ~15% shorter than before (42% → 35.7%)
                  'left-3 right-3 top-3 max-h-[35.7%]'
                : // No reference: fill card with equal inset on all sides
                  'inset-3',
            )}
          >
            {title ? (
              <Text
                as="p"
                variant="body-sm"
                color="white"
                translate={false}
                className={clsx(
                  'font-medium',
                  hasImage ? 'line-clamp-2' : 'line-clamp-4',
                )}
              >
                {title}
              </Text>
            ) : null}
            {prompt ? (
              <Text
                as="p"
                variant="caption"
                color="white"
                translate={false}
                className={clsx(
                  'whitespace-pre-wrap leading-5 text-white/90',
                  title && 'mt-1.5',
                )}
              >
                {prompt}
              </Text>
            ) : null}
          </div>
        ) : null}
        <PhotoInset
          src={exampleSrc}
          alt={exampleLabel}
          label={exampleLabel}
          priority={priority}
          onClick={onOpenExamplePreview}
          ariaLabel={openExampleAriaLabel}
        />
      </div>
    </motion.article>
  )
}

function ResultCard({
  src,
  alt,
  label,
  priority = false,
  onOpenPreview,
  openPreviewAriaLabel,
}) {
  const reducedMotion = useReducedMotion()
  const hasImage = Boolean(src)

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={clsx(
        'group relative w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:border-cyan-400/30',
        hasImage && 'cursor-zoom-in',
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-background-soft/60">
        {hasImage && onOpenPreview ? (
          <button
            type="button"
            onClick={onOpenPreview}
            aria-label={openPreviewAriaLabel || `Open ${label} preview`}
            className="absolute inset-0 z-[1] cursor-zoom-in"
          />
        ) : null}
        {hasImage ? (
          <AnimatePresence initial={false}>
            <ShowcasePreviewImage
              key={src}
              src={src}
              alt={alt}
              imageKey={src}
              priority={priority}
              objectPositionClassName="object-center"
            />
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 via-slate-950 to-black" />
        )}
      </div>
    </motion.article>
  )
}

export default function ImagineShowcasePreview() {
  const dispatch = useDispatch()
  const user = useSelector(getUser)
  const isAdmin = user?.role === 'admin'
  const templatesByMode = useSelector(getImagineTemplatesState)
  const templatesLoading = useSelector(getImagineTemplatesLoading)
  const loadedRef = useRef(false)

  const [pinnedModeId, setPinnedModeId] = useState(null)
  const [templateToDelete, setTemplateToDelete] = useState(null)
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  const promptLabel = useTranslate('Prompt', { caseMode: 'title' })
  const generatedLabel = useTranslate('Generated', { caseMode: 'title' })
  const yourPhotoLabel = useTranslate('Your photo', { caseMode: 'title' })
  const designExampleLabel = useTranslate('Design example', { caseMode: 'title' })
  const openPreviewText = useTranslate('Open image preview', {
    caseMode: 'sentence',
  })

  const hasAnyTemplates = useMemo(
    () =>
      Object.values(templatesByMode || {}).some(
        (items) => Array.isArray(items) && items.length > 0,
      ),
    [templatesByMode],
  )

  const showcaseItems = useMemo(
    () => buildItems(templatesByMode, pinnedModeId || ''),
    [pinnedModeId, templatesByMode],
  )

  const rotationResetKey = pinnedModeId ? `pinned:${pinnedModeId}` : 'auto'
  const [activeIndex, setActiveIndex] = useRotatingIndex(
    showcaseItems.length,
    CARD_ROTATE_MS,
    rotationResetKey,
  )

  const preloadUrls = useMemo(
    () => collectRotationPreloadUrls(showcaseItems, activeIndex, 2),
    [showcaseItems, activeIndex],
  )
  usePreloadImages(preloadUrls)

  const activeItem = showcaseItems[activeIndex] || null
  const highlightedModeId =
    pinnedModeId || activeItem?.modeId || IMAGINE_MODES[0].id
  const activeMode =
    IMAGINE_MODES.find((mode) => mode.id === highlightedModeId) ||
    IMAGINE_MODES[0]

  const displayPrompt = buildDisplayPrompt({
    templatePrompt: activeItem?.prompt,
    techniqueId: activeItem?.technique,
    homeStyle: activeItem?.homeStyle,
    fallback: String(activeMode.promptPlaceholder || '').replace(
      /^Example:\s*/i,
      '',
    ),
  })

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    if (!hasAnyTemplates) {
      dispatch(getImagineTemplates())
    }
  }, [dispatch, hasAnyTemplates])

  const handleModeChipClick = useCallback(
    (modeId) => {
      setPinnedModeId((current) => (current === modeId ? null : modeId))
      setActiveIndex(0)
    },
    [setActiveIndex],
  )

  const openImagePreview = useCallback(({ src, alt, title }) => {
    if (!src) return
    setPreviewModal({ open: true, src, alt, title })
  }, [])

  const closeImagePreview = useCallback(() => {
    setPreviewModal({ open: false, src: '', alt: '', title: '' })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!templateToDelete?.templateId) return

    try {
      await dispatch(deleteImagineTemplate(templateToDelete.templateId)).unwrap()
      setTemplateToDelete(null)
      setActiveIndex(0)
    } catch (error) {
      console.error(error)
    }
  }, [dispatch, setActiveIndex, templateToDelete])

  return (
    <section className="gradient-border-card overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="flex h-full flex-col p-2 sm:p-3">
          <div className="flex flex-1 flex-col justify-center">
            <Text
              as="p"
              variant="caption"
              color="soft"
              caseMode="sentence"
              className="mb-2 uppercase tracking-[0.22em]"
            >
              live preview
            </Text>

            {templatesLoading && !activeItem ? (
              <Text as="h2" variant="h2" color="white" caseMode="sentence">
                Loading examples...
              </Text>
            ) : (
              <>
                <Text as="h2" variant="h2" color="white" caseMode="sentence">
                  {activeMode.title}
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                  className="mt-3 max-w-xl leading-6"
                >
                  {activeMode.description}
                </Text>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 lg:mt-0 lg:pt-5">
            {IMAGINE_MODES.map((mode) => (
              <ModeChip
                key={mode.id}
                mode={mode}
                active={highlightedModeId === mode.id}
                pinned={pinnedModeId === mode.id}
                onClick={() => handleModeChipClick(mode.id)}
              />
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-5">
            {isAdmin && activeItem?.templateId ? (
              <button
                type="button"
                onClick={() => setTemplateToDelete(activeItem)}
                className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 text-red-100 backdrop-blur-md transition hover:border-red-300/60 hover:bg-red-500/25 sm:right-5 sm:top-5"
                aria-label="Delete template"
              >
                <Trash2 size={16} />
              </button>
            ) : null}

            <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-5">
              <PreviewBadge variant="header" tone="primary">
                {activeItem?.faceSrc ? yourPhotoLabel : promptLabel}
              </PreviewBadge>
              <PreviewBadge
                variant="header"
                tone="neutral"
                shine
                shineSeed={`generated-${activeItem?.id || activeMode.id}`}
              >
                {generatedLabel}
              </PreviewBadge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <SourceCard
                key={`source-${activeItem?.id || activeMode.id}-${activeItem?.faceSrc || displayPrompt}`}
                src={activeItem?.faceSrc || ''}
                alt={activeItem?.title || yourPhotoLabel}
                title={activeItem?.title || ''}
                prompt={displayPrompt}
                exampleSrc={activeItem?.exampleSrc || ''}
                exampleLabel={activeItem?.exampleSrc ? designExampleLabel : ''}
                priority={activeIndex === 0}
                openPreviewAriaLabel={`${openPreviewText}: ${yourPhotoLabel}`}
                openExampleAriaLabel={`${openPreviewText}: ${designExampleLabel}`}
                onOpenPreview={
                  activeItem?.faceSrc
                    ? () =>
                        openImagePreview({
                          src: activeItem.faceSrc,
                          alt: activeItem.title || yourPhotoLabel,
                          title: yourPhotoLabel,
                        })
                    : undefined
                }
                onOpenExamplePreview={
                  activeItem?.exampleSrc
                    ? () =>
                        openImagePreview({
                          src: activeItem.exampleSrc,
                          alt: designExampleLabel,
                          title: designExampleLabel,
                        })
                    : undefined
                }
              />
              <ResultCard
                src={activeItem?.afterSrc || ''}
                alt={activeItem?.title || activeMode.title}
                label={generatedLabel}
                priority={activeIndex === 0}
                openPreviewAriaLabel={`${openPreviewText}: ${generatedLabel}`}
                onOpenPreview={
                  activeItem?.afterSrc
                    ? () =>
                        openImagePreview({
                          src: activeItem.afterSrc,
                          alt: activeItem.title || activeMode.title,
                          title: activeItem.title || activeMode.title,
                        })
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closeImagePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />

      {templateToDelete ? (
        <div className={MODAL_OVERLAY_CLASS}>
          <div className="w-full max-w-[420px] rounded-[24px] border border-white/10 bg-[#10121a] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Text as="h3" variant="h3" color="white" caseMode="sentence">
                  Delete template?
                </Text>
                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                  className="mt-2"
                >
                  This action cannot be undone.
                </Text>
              </div>
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Close delete confirmation"
              >
                <X size={16} />
              </button>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <Text as="p" variant="body-sm" color="white" translate={false}>
                {templateToDelete.title || templateToDelete.prompt}
              </Text>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTemplateToDelete(null)}
                className="rounded-full px-5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmDelete}
                className="rounded-full px-5"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
