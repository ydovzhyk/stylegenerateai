'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Trash2, X } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'
import { useTranslate } from '@/utils/translate/translate'
import { PHOTO_LAB_MODES } from '@/components/photo-lab/photo-lab-modes'
import { getPhotoLabTemplates, deletePhotoLabTemplate } from '@/store/photo-lab/photo-lab-operations'
import {
  getPhotoLabTemplatesLoading,
  getPhotoLabTemplatesState,
} from '@/store/photo-lab/photo-lab-selectors'
import { getUser } from '@/store/auth/auth-selectors'

const CARD_ROTATE_MS = 8200

const MODE_PREVIEW_LABELS = {
  professional_portrait: { before: 'Casual', after: 'LinkedIn-ready' },
  restore_colorize: { before: 'Old photo', after: 'Restored' },
  smart_edit: { before: 'Original', after: 'Edited' },
  remove_objects: { before: 'Distracting', after: 'Clean' },
  enhance_quality: { before: 'Soft', after: 'Clearer' },
  creative_retouch: { before: 'Everyday', after: 'Instagram-ready' },
}

const MODE_SOURCE_BADGE_LABELS = {
  professional_portrait: 'Casual photo',
  restore_colorize: 'Old photo',
  smart_edit: 'Original',
  remove_objects: 'Distracting',
  enhance_quality: 'Soft',
  creative_retouch: 'Everyday',
}

function getSourceBadgeLabel(modeId = '') {
  return (
    MODE_SOURCE_BADGE_LABELS[modeId] ||
    MODE_PREVIEW_LABELS[modeId]?.before ||
    'Before'
  )
}

const SHOWCASE_MODE_ITEMS = [
  {
    id: 'professional_portrait',
    afterLabel: 'LinkedIn-ready',
    title: 'LinkedIn-ready portrait',
    description:
      'Same you in a clean business look — professional outfit and a modern office setting.',
  },
  {
    id: 'restore_colorize',
    afterLabel: 'Restored',
    title: 'Restore family memories',
    description:
      'Repair damage and fading — keep the original look, or add natural color.',
  },
  {
    id: 'smart_edit',
    afterLabel: 'Edited',
    title: 'Change outfit or scene',
    description: 'Modify clothing, objects, lighting, and background.',
  },
  {
    id: 'remove_objects',
    afterLabel: 'Clean',
    title: 'Remove unwanted objects',
    description:
      'Clear out distractions — keep the rest of the shot exactly as it was.',
  },
  {
    id: 'enhance_quality',
    afterLabel: 'Clearer',
    title: 'Sharper photo quality',
    description:
      'Recover detail and cut haze or compression — same photo, easier to read.',
  },
  {
    id: 'creative_retouch',
    afterLabel: 'Instagram-ready',
    title: 'Premium Instagram polish',
    description:
      'Same shot, cleaner finish: polished skin, even tone, and a premium look.',
  },
]

function getModeMeta(modeId) {
  return PHOTO_LAB_MODES.find((mode) => mode.id === modeId) || null
}

function getShowcaseModeItem(modeId) {
  return (
    SHOWCASE_MODE_ITEMS.find((item) => item.id === modeId) ||
    SHOWCASE_MODE_ITEMS[0]
  )
}

function mapTemplateToShowcaseItem(template) {
  const modeId = String(template?.mode || '').trim()
  const modeMeta = getModeMeta(modeId)
  const labels = MODE_PREVIEW_LABELS[modeId] || {
    before: 'Before',
    after: 'After',
  }

  return {
    id: template?._id || template?.slug || `${modeId}-${template?.title}`,
    templateId: template?._id || null,
    modeId,
    title: String(template?.title || modeMeta?.title || '').trim(),
    subjectGender: String(template?.subjectGender || '').trim(),
    beforeSrc: String(template?.sourceImageUrl || '').trim(),
    afterSrc: String(template?.resultImageUrl || '').trim(),
    beforeLabel: labels.before,
    afterLabel: labels.after,
    category: modeMeta?.label || modeMeta?.title || modeId,
  }
}

function buildAutoShowcaseItems(templatesByMode = {}) {
  const items = []

  PHOTO_LAB_MODES.forEach((mode) => {
    const modeTemplates = templatesByMode[mode.id] || []

    modeTemplates.forEach((template) => {
      items.push(mapTemplateToShowcaseItem(template))
    })
  })

  return items
}

function buildPinnedShowcaseItems(templatesByMode = {}, modeId = '') {
  const modeTemplates = templatesByMode[modeId] || []
  return modeTemplates.map((template) => mapTemplateToShowcaseItem(template))
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

function getAccentClasses(accent = 'primary') {
  return {
    accentBorder:
      accent === 'primary' ? 'border-primary/25' : 'border-cyan-400/25',
    accentText: accent === 'primary' ? 'text-primary-soft' : 'text-cyan-300',
    hoverBorder:
      accent === 'primary'
        ? 'hover:border-primary/30'
        : 'hover:border-cyan-400/30',
  }
}

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

function PreviewImageCard({
  src,
  alt,
  category,
  label,
  labelType = 'default',
  accent = 'cyan',
  imageKey,
  shineSeed,
  showMeta = false,
  onOpenPreview,
  openPreviewAriaLabel,
}) {
  const reducedMotion = useReducedMotion()
  const { accentBorder, accentText, hoverBorder } = getAccentClasses(accent)
  const hasImage = Boolean(src)
  const isPreviewable = hasImage && typeof onOpenPreview === 'function'

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group relative w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm transition ${hoverBorder} ${isPreviewable ? 'cursor-zoom-in' : ''}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-background-soft/60">
        {isPreviewable ? (
          <button
            type="button"
            onClick={onOpenPreview}
            aria-label={openPreviewAriaLabel || `Open ${label} preview`}
            className="absolute inset-0 z-[1] cursor-zoom-in"
          />
        ) : null}
        {hasImage ? (
          <AnimatePresence initial={false}>
            <motion.img
              key={imageKey || src}
              src={src}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover object-[50%_5%]"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.03, filter: 'blur(2px)' }
              }
              animate={
                reducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, filter: 'blur(0px)' }
              }
              exit={{ opacity: 0 }}
              whileHover={reducedMotion ? undefined : { scale: 1.045 }}
              transition={{
                duration: reducedMotion ? 0.1 : 0.95,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 via-slate-950 to-black" />
        )}

        <div className="pointer-events-none absolute -inset-px bg-[linear-gradient(to_top,rgba(3,6,18,0.92)_0%,rgba(3,6,18,0.22)_34%,rgba(3,6,18,0.04)_62%,rgba(3,6,18,0.24)_100%)]" />

        {showMeta && category ? (
          <div className="absolute left-4 right-4 top-4 z-[2]">
            <span
              className={`inline-flex rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm ${accentText}`}
            >
              {category}
            </span>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-[2] p-4">
          {labelType === 'after' ? (
            <ShinyBadge
              shineSeed={`${labelType}-${shineSeed}`}
              className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm ${accentBorder} ${accentText} bg-black/30`}
            >
              {label}
            </ShinyBadge>
          ) : (
            <span className="inline-flex rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
              {label}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function PreviewPair({ item, accent = 'cyan', contentKey, onOpenPreview }) {
  const beforeLabel = useTranslate(item?.beforeLabel || 'Before', {
    caseMode: 'title',
  })
  const afterLabel = useTranslate(item?.afterLabel || 'After', {
    caseMode: 'title',
  })
  const beforeAltText = useTranslate('before', { caseMode: 'lower' })
  const afterAltText = useTranslate('after', { caseMode: 'lower' })
  const openPreviewText = useTranslate('Open image preview', {
    caseMode: 'sentence',
  })

  if (!item) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <PreviewImageCard
        src={item.beforeSrc}
        alt={`${item.title} ${beforeAltText}`}
        label={beforeLabel}
        labelType="before"
        accent={accent}
        imageKey={`before-${contentKey}-${item.beforeSrc}`}
        shineSeed={`before-${contentKey}`}
        openPreviewAriaLabel={`${openPreviewText}: ${beforeLabel}`}
        onOpenPreview={
          onOpenPreview
            ? () =>
                onOpenPreview({
                  src: item.beforeSrc,
                  alt: `${item.title} ${beforeAltText}`,
                  title: `${item.title} — ${beforeLabel}`,
                })
            : undefined
        }
      />

      <PreviewImageCard
        src={item.afterSrc}
        alt={`${item.title} ${afterAltText}`}
        label={afterLabel}
        labelType="after"
        accent={accent}
        imageKey={`after-${contentKey}-${item.afterSrc}`}
        shineSeed={`after-${contentKey}`}
        openPreviewAriaLabel={`${openPreviewText}: ${afterLabel}`}
        onOpenPreview={
          onOpenPreview
            ? () =>
                onOpenPreview({
                  src: item.afterSrc,
                  alt: `${item.title} ${afterAltText}`,
                  title: `${item.title} — ${afterLabel}`,
                })
            : undefined
        }
      />
    </div>
  )
}

function PreviewGroupCard({
  item,
  accent = 'cyan',
  contentKey,
  onOpenPreview,
  isAdmin = false,
  onRequestDelete,
}) {
  const { accentBorder, accentText } = getAccentClasses(accent)
  const aiTransformationText = useTranslate('AI transformation', {
    caseMode: 'none',
  })

  if (!item) return null

  const sourceBadgeLabel = useTranslate(getSourceBadgeLabel(item.modeId), {
    caseMode: 'title',
  })

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-5">
      {isAdmin && item.templateId ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onRequestDelete?.(item)
          }}
          className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 text-red-100 backdrop-blur-md transition hover:border-red-300/60 hover:bg-red-500/25 sm:right-5 sm:top-5"
          aria-label="Delete template"
        >
          <Trash2 size={16} />
        </button>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-5">
        <span
          className={`flex min-h-[42px] items-center justify-center rounded-full border px-3 py-1 text-center text-[11px] uppercase leading-[1.45] tracking-[0.18em] ${accentBorder} ${accentText} bg-white/[0.03]`}
        >
          {sourceBadgeLabel}
        </span>

        <ShinyBadge
          shineSeed={`ai-${contentKey}`}
          className="flex min-h-[42px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-center text-[11px] uppercase leading-[1.45] tracking-[0.18em] text-white/55"
        >
          {aiTransformationText}
        </ShinyBadge>
      </div>

      <PreviewPair
        item={item}
        accent={accent}
        contentKey={contentKey}
        onOpenPreview={onOpenPreview}
      />
    </div>
  )
}

function ShowcaseModeChip({ modeItem, active, pinned, onClick }) {
  const label = useTranslate(modeItem.afterLabel, { caseMode: 'title' })

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

export default function PhotoLabShowcasePreview() {
  const dispatch = useDispatch()
  const user = useSelector(getUser)
  const isAdmin = user?.role === 'admin'

  const [pinnedModeId, setPinnedModeId] = useState(null)
  const [templateToDelete, setTemplateToDelete] = useState(null)
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  const templatesByMode = useSelector(getPhotoLabTemplatesState)
  const templatesLoading = useSelector(getPhotoLabTemplatesLoading)

  const templatesInitialLoadedRef = useRef(false)

  const hasAnyTemplates = useMemo(() => {
    return Object.values(templatesByMode).some(
      (items) => Array.isArray(items) && items.length > 0,
    )
  }, [templatesByMode])

  const showcaseItems = useMemo(() => {
    if (pinnedModeId) {
      return buildPinnedShowcaseItems(templatesByMode, pinnedModeId)
    }

    return buildAutoShowcaseItems(templatesByMode)
  }, [pinnedModeId, templatesByMode])

  const rotationResetKey = pinnedModeId ? `pinned:${pinnedModeId}` : 'auto'

  const [activeIndex, setActiveIndex] = useRotatingIndex(
    showcaseItems.length,
    CARD_ROTATE_MS,
    rotationResetKey,
  )

  const activeItem = showcaseItems[activeIndex] || null

  const highlightedModeId =
    pinnedModeId || activeItem?.modeId || SHOWCASE_MODE_ITEMS[0].id

  const activeShowcaseMode = useMemo(
    () => getShowcaseModeItem(highlightedModeId),
    [highlightedModeId],
  )

  useEffect(() => {
    if (templatesInitialLoadedRef.current) return

    if (hasAnyTemplates) {
      templatesInitialLoadedRef.current = true
      return
    }

    templatesInitialLoadedRef.current = true
    dispatch(getPhotoLabTemplates())
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

    setPreviewModal({
      open: true,
      src,
      alt,
      title,
    })
  }, [])

  const closeImagePreview = useCallback(() => {
    setPreviewModal({
      open: false,
      src: '',
      alt: '',
      title: '',
    })
  }, [])

  const handleConfirmDeleteTemplate = useCallback(async () => {
    if (!templateToDelete?.templateId) return

    try {
      await dispatch(deletePhotoLabTemplate(templateToDelete.templateId)).unwrap()
      setTemplateToDelete(null)
      setActiveIndex(0)
    } catch (error) {
      console.error(error)
    }
  }, [dispatch, setActiveIndex, templateToDelete])

  return (
    <section className="gradient-border-card overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="p-2 sm:p-3">
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
                {activeShowcaseMode.title}
              </Text>

              <Text
                as="p"
                variant="body-sm"
                color="muted"
                caseMode="sentence"
                className="mt-3 max-w-xl leading-6"
              >
                {activeShowcaseMode.description}
              </Text>
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {SHOWCASE_MODE_ITEMS.map((modeItem) => (
              <ShowcaseModeChip
                key={modeItem.id}
                modeItem={modeItem}
                active={highlightedModeId === modeItem.id}
                pinned={pinnedModeId === modeItem.id}
                onClick={() => handleModeChipClick(modeItem.id)}
              />
            ))}
          </div>
        </div>

        <div className="relative">
          {activeItem ? (
            <PreviewGroupCard
              item={activeItem}
              accent="cyan"
              contentKey={`${activeItem.id}-${activeIndex}`}
              onOpenPreview={openImagePreview}
              isAdmin={isAdmin}
              onRequestDelete={setTemplateToDelete}
            />
          ) : (
            <PreviewGroupCard
              item={{
                id: 'placeholder',
                modeId: activeShowcaseMode.id,
                title: activeShowcaseMode.title,
                beforeSrc: '',
                afterSrc: '',
                beforeLabel:
                  MODE_PREVIEW_LABELS[activeShowcaseMode.id]?.before ||
                  'Before',
                afterLabel:
                  MODE_PREVIEW_LABELS[activeShowcaseMode.id]?.after || 'After',
              }}
              accent="cyan"
              contentKey={`placeholder-${activeShowcaseMode.id}`}
            />
          )}
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
              <Text as="p" variant="body-sm" color="white" caseMode="sentence">
                {templateToDelete.title || 'Selected template'}
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
                onClick={handleConfirmDeleteTemplate}
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
