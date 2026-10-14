'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Trash2, X } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import ShowcasePreviewImage from '@/components/shared/showcase-preview-image/ShowcasePreviewImage'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'
import { IMAGINE_MODES } from '@/constants/imagine'
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

function ShinyBadge({ children, className = '', shineSeed }) {
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

function mapTemplate(template) {
  const modeId = String(template?.mode || '').trim()

  return {
    id: template?._id || `${modeId}-${template?.title}`,
    templateId: template?._id || null,
    modeId,
    title: String(template?.title || '').trim(),
    prompt: String(template?.prompt || '').trim(),
    afterSrc: String(template?.resultImageUrl || '').trim(),
    faceSrc: String(template?.referenceImageUrl || '').trim(),
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

function PromptCard({ prompt, title, label, showBadge = true }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(160deg,rgba(124,92,255,0.18)_0%,rgba(8,10,18,0.2)_42%,rgba(3,6,18,0.72)_100%)]">
        <div
          className={clsx(
            'absolute inset-0 flex flex-col px-5 pt-5 sm:px-6',
            showBadge ? 'pb-16' : 'pb-5',
          )}
        >
          {title ? (
            <Text
              as="p"
              variant="section-title"
              color="white"
              translate={false}
              className="mb-4 line-clamp-3 shrink-0"
            >
              {title}
            </Text>
          ) : null}
          <div
            className={clsx(
              'flex min-h-0 flex-1 overflow-y-auto',
              title ? 'items-start' : 'items-center',
            )}
          >
            <Text
              as="p"
              variant="body-sm"
              color="white"
              translate={false}
              className="w-full whitespace-pre-wrap leading-6 text-white/90"
            >
              {prompt}
            </Text>
          </div>
        </div>
        {showBadge ? (
          <div className="absolute inset-x-0 bottom-0 z-[2] p-4">
            <span className="inline-flex rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
              {label}
            </span>
          </div>
        ) : null}
      </div>
    </motion.article>
  )
}

function ResultCard({
  src,
  alt,
  label,
  shineSeed,
  insetSrc,
  insetAlt,
  insetLabel,
  priority = false,
  onOpenPreview,
  openPreviewAriaLabel,
  showBadge = true,
}) {
  const reducedMotion = useReducedMotion()
  const hasImage = Boolean(src)
  const hasInset = Boolean(insetSrc)

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
            />
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 via-slate-950 to-black" />
        )}

        <div className="pointer-events-none absolute -inset-px bg-[linear-gradient(to_top,rgba(3,6,18,0.92)_0%,rgba(3,6,18,0.22)_34%,rgba(3,6,18,0.04)_62%,rgba(3,6,18,0.24)_100%)]" />

        {hasInset ? (
          <div className="pointer-events-none absolute bottom-[14%] right-3 z-[3] w-[30%] overflow-hidden rounded-2xl border border-white/25 bg-black/40 shadow-[0_10px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:bottom-4 sm:right-4">
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={insetSrc}
                alt={insetAlt || insetLabel || 'Your photo'}
                fill
                sizes="120px"
                priority={priority}
                unoptimized
                className="object-cover object-[center_18%]"
              />
              {insetLabel ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-1.5 py-1.5">
                  <span className="block truncate text-center text-[9px] uppercase tracking-[0.14em] text-white/85">
                    {insetLabel}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showBadge ? (
          <div
            className={clsx(
              'absolute z-[2] p-4',
              hasInset ? 'inset-x-0 bottom-0 sm:right-[34%] sm:left-0' : 'inset-x-0 bottom-0',
            )}
          >
            <ShinyBadge
              shineSeed={shineSeed}
              className="rounded-full border border-cyan-400/25 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-300 backdrop-blur-sm"
            >
              {label}
            </ShinyBadge>
          </div>
        ) : null}
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

  const displayPrompt =
    activeItem?.prompt ||
    String(activeMode.promptPlaceholder || '').replace(/^Example:\s*/i, '')

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
              <span className="flex min-h-[42px] items-center justify-center rounded-full border border-primary/25 bg-white/[0.03] px-3 py-1 text-center text-[11px] uppercase leading-[1.45] tracking-[0.18em] text-primary-soft">
                {promptLabel}
              </span>
              <ShinyBadge
                shineSeed={`generated-${activeItem?.id || activeMode.id}`}
                className="flex min-h-[42px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-center text-[11px] uppercase leading-[1.45] tracking-[0.18em] text-white/55"
              >
                {generatedLabel}
              </ShinyBadge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <PromptCard
                key={`prompt-${activeItem?.id || activeMode.id}-${displayPrompt}`}
                prompt={displayPrompt}
                title={activeItem?.title || ''}
                label={promptLabel}
                showBadge={highlightedModeId !== 'wallpaper'}
              />
              <ResultCard
                src={activeItem?.afterSrc || ''}
                alt={activeItem?.title || activeMode.title}
                label={generatedLabel}
                showBadge={highlightedModeId !== 'wallpaper'}
                shineSeed={`result-${activeItem?.id || activeMode.id}`}
                insetSrc={activeItem?.faceSrc || ''}
                insetAlt={activeItem?.title || 'Your photo'}
                insetLabel={activeItem?.faceSrc ? yourPhotoLabel : ''}
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
