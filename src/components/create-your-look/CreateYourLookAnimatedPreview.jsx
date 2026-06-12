'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Trash2, X } from 'lucide-react'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import { useTranslate } from '@/utils/translate/translate'
import { PROTOTYPE_MAP } from '@/constants/prototype-source-map'
import {
  getYourLookPreviewTemplates as getYourLookPreviewTemplatesOperation,
  hideReadyTemplateFromCreateYourLook,
} from '@/store/ready-template/ready-template-operations'
import {
  getYourLookPreviewHasMore,
  getYourLookPreviewLoading,
  getYourLookPreviewTemplates as selectYourLookPreviewTemplates,
} from '@/store/ready-template/ready-template-selectors'
import { getUser } from '@/store/auth/auth-selectors'

const CARD_ROTATE_MS = 8200
const PREVIEW_LIMIT = 5

function resolvePreviewGender(previewSourceKey = '') {
  const key = String(previewSourceKey).trim().toLowerCase()

  if (key.startsWith('woman_') || key.includes('_female_')) {
    return 'woman'
  }

  if (key.startsWith('man_') || key.includes('_male_')) {
    return 'man'
  }

  return 'woman'
}

function mapPreviewItem(item) {
  const previewSourceKey = String(item?.previewSourceKey || '').trim()

  return {
    id:
      item?._id ||
      item?.slug ||
      `${previewSourceKey}-${String(item?.previewUrl || '')}-${String(item?.title || '')}`,
    templateId: item?._id || null,
    title: String(item?.title || '').trim(),
    category: String(item?.category || '').trim(),
    beforeSrc: PROTOTYPE_MAP[previewSourceKey] || '',
    afterSrc: String(item?.previewUrl || '').trim(),
    previewSourceKey,
    gender: resolvePreviewGender(previewSourceKey),
  }
}

function buildMobileSequence(manItems = [], womanItems = []) {
  const result = []
  const maxLen = Math.max(manItems.length, womanItems.length)

  for (let i = 0; i < maxLen; i += 1) {
    if (manItems[i]) result.push(manItems[i])
    if (womanItems[i]) result.push(womanItems[i])
  }

  return result
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

function useRotatingIndex(length, delay) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (length <= 0) {
      setIndex(0)
      return
    }

    setIndex((prev) => {
      if (prev >= length) return 0
      return prev
    })
  }, [length])

  useEffect(() => {
    if (length <= 1) return

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % length)
    }, delay)

    return () => clearInterval(timer)
  }, [length, delay])

  return index
}

function PreviewImageCard({
  src,
  alt,
  category,
  label,
  labelType = 'default',
  accent = 'primary',
  imageKey,
  shineSeed,
  showMeta = false,
  onOpenPreview,
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
            aria-label={`Open ${label} preview`}
            className="absolute inset-0 z-[1] cursor-zoom-in"
          />
        ) : null}

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

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(3,6,18,0.82)_0%,rgba(3,6,18,0.18)_34%,rgba(3,6,18,0.03)_62%,rgba(3,6,18,0.16)_100%)]" />

        {showMeta ? (
          <div className="absolute left-4 right-4 top-4 z-[2]">
            {category ? (
              <span
                className={`mb-2 inline-flex rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm ${accentText}`}
              >
                {category}
              </span>
            ) : null}
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

function PreviewPair({ item, accent = 'primary', contentKey, onOpenPreview }) {
  const beforeText = useTranslate('Before', { caseMode: 'title' })
  const afterText = useTranslate('After', { caseMode: 'title' })
  const beforeAltText = useTranslate('before', { caseMode: 'lower' })
  const afterAltText = useTranslate('after', { caseMode: 'lower' })

  if (!item) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <PreviewImageCard
        src={item.beforeSrc}
        alt={`${item.title} ${beforeAltText}`}
        category={item.category}
        label={beforeText}
        labelType="before"
        accent={accent}
        imageKey={`before-${contentKey}-${item.beforeSrc}`}
        shineSeed={`before-${contentKey}`}
        showMeta
        onOpenPreview={
          onOpenPreview
            ? () =>
                onOpenPreview({
                  src: item.beforeSrc,
                  alt: `${item.title} ${beforeAltText}`,
                  title: `${item.title} — ${beforeText}`,
                })
            : undefined
        }
      />

      <PreviewImageCard
        src={item.afterSrc}
        alt={`${item.title} ${afterAltText}`}
        label={afterText}
        labelType="after"
        accent={accent}
        imageKey={`after-${contentKey}-${item.afterSrc}`}
        shineSeed={`after-${contentKey}`}
        onOpenPreview={
          onOpenPreview
            ? () =>
                onOpenPreview({
                  src: item.afterSrc,
                  alt: `${item.title} ${afterAltText}`,
                  title: `${item.title} — ${afterText}`,
                })
            : undefined
        }
      />
    </div>
  )
}

function PreviewGroupCard({
  item,
  accent = 'primary',
  contentKey,
  onOpenPreview,
  isAdmin = false,
  onRequestDelete,
}) {
  const { accentBorder, accentText } = getAccentClasses(accent)

  const malePreviewText = useTranslate('male preview', { caseMode: 'lower' })
  const femalePreviewText = useTranslate('female preview', {
    caseMode: 'lower',
  })
  const aiTransformationText = useTranslate('AI transformation', {
    caseMode: 'none',
  })

  if (!item) return null

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

      <div className="mb-4 grid grid-cols-2 gap-3">
        <span
          className={`flex min-h-[42px] items-center justify-center rounded-full border px-3 py-1 text-center text-[11px] uppercase leading-[1.45] tracking-[0.18em] ${accentBorder} ${accentText} bg-white/[0.03]`}
        >
          {item.gender === 'man' ? malePreviewText : femalePreviewText}
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

export default function CreateYourLookAnimatedPreview() {
  const dispatch = useDispatch()
  const user = useSelector(getUser)
  const isAdmin = user?.role === 'admin'

  const [templateToDelete, setTemplateToDelete] = useState(null)
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  const previewGroups = useSelector(selectYourLookPreviewTemplates)
  const previewLoading = useSelector(getYourLookPreviewLoading)
  const previewHasMore = useSelector(getYourLookPreviewHasMore)

  const lastPreviewRequestKeyRef = useRef('')
  const previewInitialLoadedRef = useRef(false)
  const requestedPreviewLengthRef = useRef(0)

  const allPreviewItems = useMemo(
    () => [...(previewGroups?.man || []), ...(previewGroups?.woman || [])],
    [previewGroups],
  )

  const hasPreviewItems = allPreviewItems.length > 0

  useEffect(() => {
    lastPreviewRequestKeyRef.current = ''
  }, [previewGroups])

  useEffect(() => {
    if (previewInitialLoadedRef.current) return
    if (hasPreviewItems) {
      previewInitialLoadedRef.current = true
      return
    }

    previewInitialLoadedRef.current = true

    dispatch(
      getYourLookPreviewTemplatesOperation({
        limit: PREVIEW_LIMIT,
        mode: 'replace',
      }),
    )
  }, [dispatch, hasPreviewItems])

  const handleNeedMorePreviewTemplates = useCallback(() => {
    if (previewLoading) return
    if (!previewHasMore?.man && !previewHasMore?.woman) return

    const excludeIds = allPreviewItems.map((item) => item?._id).filter(Boolean)
    const requestKey = excludeIds.join('|')

    if (lastPreviewRequestKeyRef.current === requestKey) return
    lastPreviewRequestKeyRef.current = requestKey

    dispatch(
      getYourLookPreviewTemplatesOperation({
        limit: PREVIEW_LIMIT,
        excludeIds,
        mode: 'append',
      }),
    )
  }, [dispatch, allPreviewItems, previewLoading, previewHasMore])

  const manItems = useMemo(
    () =>
      (previewGroups?.man || [])
        .map(mapPreviewItem)
        .filter((item) => item.beforeSrc && item.afterSrc),
    [previewGroups],
  )

  const womanItems = useMemo(
    () =>
      (previewGroups?.woman || [])
        .map(mapPreviewItem)
        .filter((item) => item.beforeSrc && item.afterSrc),
    [previewGroups],
  )

  const mobileItems = useMemo(
    () => buildMobileSequence(manItems, womanItems),
    [manItems, womanItems],
  )

  const desktopPairsLength = Math.min(manItems.length, womanItems.length)

  const desktopIndex = useRotatingIndex(desktopPairsLength, CARD_ROTATE_MS)
  const mobileIndex = useRotatingIndex(mobileItems.length, CARD_ROTATE_MS)

  const activeMan = manItems[desktopIndex] || null
  const activeWoman = womanItems[desktopIndex] || null
  const activeMobile = mobileItems[mobileIndex] || null

  useEffect(() => {
    if (desktopPairsLength <= 0) return

    const remainingPairs = desktopPairsLength - desktopIndex - 1

    if (remainingPairs > 2) return
    if (requestedPreviewLengthRef.current === desktopPairsLength) return

    requestedPreviewLengthRef.current = desktopPairsLength
    handleNeedMorePreviewTemplates()
  }, [desktopIndex, desktopPairsLength, handleNeedMorePreviewTemplates])

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
      await dispatch(
        hideReadyTemplateFromCreateYourLook(templateToDelete.templateId),
      ).unwrap()
      setTemplateToDelete(null)
    } catch (error) {
      console.error(error)
    }
  }, [dispatch, templateToDelete])

  if (!activeMobile && !activeMan && !activeWoman) return null

  return (
    <section>
      <div className="lg:hidden">
        <PreviewGroupCard
          item={activeMobile}
          accent={activeMobile?.gender === 'man' ? 'primary' : 'cyan'}
          contentKey={`${activeMobile?.id}-${mobileIndex}`}
          onOpenPreview={openImagePreview}
          isAdmin={isAdmin}
          onRequestDelete={setTemplateToDelete}
        />
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        <PreviewGroupCard
          item={activeMan}
          accent="primary"
          contentKey={`${activeMan?.id}-${desktopIndex}`}
          onOpenPreview={openImagePreview}
          isAdmin={isAdmin}
          onRequestDelete={setTemplateToDelete}
        />

        <PreviewGroupCard
          item={activeWoman}
          accent="cyan"
          contentKey={`${activeWoman?.id}-${desktopIndex}`}
          onOpenPreview={openImagePreview}
          isAdmin={isAdmin}
          onRequestDelete={setTemplateToDelete}
        />
      </div>

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closeImagePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />

      {templateToDelete ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
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