'use client'

import BeforeAfterComparisonSlider, {
  ComparisonPreviewBadge,
  resolveComparisonPreviewTarget,
} from '@/components/shared/before-after-comparison/BeforeAfterComparisonSlider'
import GenerationActionCard from '@/components/shared/ai-image-workspace/GenerationActionCard'
import GenerationCloserPresetModal from '@/components/shared/ai-image-workspace/GenerationCloserPresetModal'
import GenerationOptionsPanel from '@/components/shared/ai-image-workspace/GenerationOptionsPanel'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import PhotoLabMaskEditor, {
  PHOTO_LAB_MASK_BRUSH_SIZES,
} from '@/components/admin/photo-lab-admin/PhotoLabMaskEditor'
import PhotoLabMaskToolbar, {
  DEFAULT_MASK_ZOOM_STATE,
} from '@/components/photo-lab/PhotoLabMaskToolbar'
import RestoreStyleToolbar from '@/components/photo-lab/RestoreStyleToolbar'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Text from '@/components/shared/text/Text'
import { BALANCED_MODEL_PRESET, DEFAULT_MODEL_PRESET } from '@/constants/model-presets'
import { DEFAULT_RESTORE_STYLE, RESTORE_COLORIZE_MODE } from '@/constants/restore-styles'
import { getGeneratedImageFormat } from '@/constants/generated-image-formats'
import { resolveGallerySourceType } from '@/constants/gallery-sections'
import { getModePreviewLabels } from '@/constants/mode-preview-labels'
import { PROTOTYPE_MAP } from '@/constants/prototype-source-map'
import useGenerationPlanAccess from '@/hooks/useGenerationPlanAccess'
import { useLanguage } from '@/providers/languageContext'
import { axiosCreateGeneratedImageFile } from '@/services/api/generated-image'
import {
  axiosDiscardPrintExportJob,
  axiosDownloadPrintExportFile,
  axiosGetPrintExportJob,
} from '@/services/api/print-export'
import { createGeneratedImage } from '@/store/generated-image/generated-image-operations'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import { generateYourLookClientImage } from '@/store/ready-template/ready-template-operations'
import { setReadyTemplateError, setReadyTemplateMessage } from '@/store/ready-template/ready-template-slice'
import { generatePhotoLabClientImage } from '@/store/photo-lab/photo-lab-operations'
import { setPhotoLabError, setPhotoLabMessage } from '@/store/photo-lab/photo-lab-slice'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { dataUrlToFile } from '@/utils/files/dataUrlToFile'
import languagesAndCodes from '@/utils/translate/languagesAndCodes'
import { translateTextTo } from '@/utils/translate/translate'
import { ImagePlus, Maximize2, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const DEFAULT_ACTION_CARD_LABELS = {}
const REMOVE_OBJECTS_MODE = 'remove_objects'
const ENHANCE_QUALITY_MODE = 'enhance_quality'
const PRINT_EXPORT_POLL_MS = 3_000
const WORKSPACE_PREVIEW_FRAME_CLASS =
  'group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[26px] border bg-background-soft/70 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:aspect-[5/6] lg:aspect-[4/5]'

export default function AiImageWorkspace({
  template,
  productKey = 'create_your_look',
  modeKey,
  restoreStyle = null,
  onRestoreStyleChange = null,
  emptyStateTitle = 'Generate your image',
  emptyStateDescription = 'Choose a template above to start generating your personalized look.',
  workspaceTitle = 'Generate your image',
  workspaceDescription = 'Upload your own photo and apply the selected AI template.',
  selectionEyebrow = 'Selected template',
  promptLabel = 'Additional prompt',
  promptPlaceholder = 'Add small details...',
  promptHint = '',
  showOutputFormat = true,
  actionCardLabels = DEFAULT_ACTION_CARD_LABELS,
}) {
  const isPhotoLab = productKey === 'photo_lab'
  const inputRef = useRef(null)
  const resultRef = useRef(null)
  const maskEditorRef = useRef(null)
  const previousTemplateIdRef = useRef(null)
  const lastPrintExportErrorRef = useRef('')
  const lastPrintExportReadyRef = useRef('')

  const dispatch = useDispatch()
  const visitorId = useSelector(getVisitorId)

  const [clientFile, setClientFile] = useState(null)
  const [clientPreview, setClientPreview] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [generatedPreview, setGeneratedPreview] = useState('')
  const [generatedFile, setGeneratedFile] = useState(null)
  const [printExport, setPrintExport] = useState(null)
  const [loading, setLoading] = useState(false)

  const [saveToGallery, setSaveToGallery] = useState(false)
  const [imageTitle, setImageTitle] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [closerPresetModalOpen, setCloserPresetModalOpen] = useState(false)
  const [maskTool, setMaskTool] = useState('brush')
  const [maskPaintActive, setMaskPaintActive] = useState(true)
  const [maskBrushSize, setMaskBrushSize] = useState(
    PHOTO_LAB_MASK_BRUSH_SIZES.small,
  )
  const [hasRemovalMask, setHasRemovalMask] = useState(false)
  const [maskZoomState, setMaskZoomState] = useState(DEFAULT_MASK_ZOOM_STATE)
  const [comparisonSliderPosition, setComparisonSliderPosition] = useState(100)

  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  const { languageIndex } = useLanguage()

  const activeModeId = modeKey || template?.id || ''
  const isRemoveObjectsMode =
    isPhotoLab && activeModeId === REMOVE_OBJECTS_MODE
  const isEnhanceQualityMode =
    isPhotoLab && activeModeId === ENHANCE_QUALITY_MODE
  const isRestoreColorizeMode =
    isPhotoLab && activeModeId === RESTORE_COLORIZE_MODE

  const resetMaskState = () => {
    setMaskTool('brush')
    setMaskPaintActive(true)
    setMaskBrushSize(PHOTO_LAB_MASK_BRUSH_SIZES.small)
    setHasRemovalMask(false)
    setMaskZoomState(DEFAULT_MASK_ZOOM_STATE)
    maskEditorRef.current?.clearMask()
  }

  const pricingContext = useMemo(() => {
    if (!template?.id) return undefined

    return {
      productKey: isPhotoLab ? 'photo_lab' : 'ready_template',
      modeKey: isPhotoLab ? modeKey || template.id : null,
      resetKey: template.id,
    }
  }, [template?.id, isPhotoLab, modeKey])

  const {
    isLogin,
    outputFormat,
    setOutputFormat,
    photoQuality,
    setPhotoQuality,
    outputFormats,
    photoQualities,
    lockedText,
    planHint,
    isFormatAllowed,
    isQualityAllowed,
    creditCost,
    modelPreset,
    setModelPreset,
    modelPresets,
    showModelPreset,
    isModelPresetAllowed,
    aiModel,
    setAiModel,
    aiModels,
    showAiModel,
    isAiModelAllowed,
    closerPresetCreditDelta,
    generatedImageFormat,
    setGeneratedImageFormat,
    generatedImageFormats,
    isGeneratedImageFormatAllowed,
  } = useGenerationPlanAccess(pricingContext)

  useEffect(() => {
    if (!printExport?.jobId || printExport.status !== 'processing') {
      return undefined
    }

    let cancelled = false

    const pollPrintExportStatus = async () => {
      try {
        const status = await axiosGetPrintExportJob(
          printExport.jobId,
          isLogin ? '' : visitorId,
        )

        if (cancelled) return

        setPrintExport((current) => ({
          ...(current || {}),
          ...status,
        }))
      } catch {
        // Ignore transient polling errors; next tick will retry.
      }
    }

    pollPrintExportStatus()

    const intervalId = window.setInterval(
      pollPrintExportStatus,
      PRINT_EXPORT_POLL_MS,
    )

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [printExport?.jobId, printExport?.status, isLogin, visitorId])

  useEffect(() => {
    if (printExport?.status !== 'failed') return

    const errorMessage =
      String(printExport?.errorMessage || '').trim() ||
      'Print export failed. Please try again.'

    const errorKey = `${printExport?.jobId || 'print-export'}:${errorMessage}`

    if (lastPrintExportErrorRef.current === errorKey) return
    lastPrintExportErrorRef.current = errorKey

    if (isPhotoLab) {
      dispatch(setPhotoLabError(errorMessage))
      return
    }

    dispatch(setReadyTemplateError(errorMessage))
  }, [
    dispatch,
    isPhotoLab,
    printExport?.errorMessage,
    printExport?.jobId,
    printExport?.status,
  ])

  useEffect(() => {
    if (printExport?.status !== 'ready') return
    if (!printExport?.jobId) return

    if (lastPrintExportReadyRef.current === printExport.jobId) return
    lastPrintExportReadyRef.current = printExport.jobId

    const message = 'Your file is ready for download.'

    if (isPhotoLab) {
      dispatch(setPhotoLabMessage(message))
      return
    }

    dispatch(setReadyTemplateMessage(message))
  }, [dispatch, isPhotoLab, printExport?.jobId, printExport?.status])

  const applyGenerationResult = (result) => {
    const previewUrl =
      result?.previewUrl ||
      result?.result?.previewUrl ||
      result?.value?.previewUrl ||
      ''

    if (!previewUrl) return

    setGeneratedPreview(previewUrl)
    setImageTitle(
      template?.title
        ? `${template.title} result`
        : isPhotoLab
          ? 'Photo Lab result'
          : 'My generated look',
    )
    setSaveToGallery(false)
    setPrintExport(result?.printExport || null)

    requestAnimationFrame(() => {
      scrollToResult()
    })

    if (isLogin || visitorId) {
      dispatch(getGenerationUsage())
    }

    if (previewUrl.startsWith('data:')) {
      setGeneratedFile(
        dataUrlToFile(
          previewUrl,
          isPhotoLab ? 'photo-lab-result.webp' : 'your-look-result.webp',
        ),
      )
    } else {
      setGeneratedFile(null)
    }
  }

  const scrollToResult = () => {
    if (!resultRef.current) return

    const yOffset = -150
    const y =
      resultRef.current.getBoundingClientRect().top +
      window.pageYOffset +
      yOffset

    window.scrollTo({
      top: y,
      behavior: 'smooth',
    })
  }

  const openImagePreview = ({ src, alt, title }) => {
    if (!src) return

    const canOpenModal =
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches

    if (!canOpenModal) return

    setPreviewModal({
      open: true,
      src,
      alt,
      title,
    })
  }

  const closeImagePreview = () => {
    setPreviewModal({
      open: false,
      src: '',
      alt: '',
      title: '',
    })
  }

  useEffect(() => {
    return () => {
      if (clientPreview) URL.revokeObjectURL(clientPreview)
    }
  }, [clientPreview])

  useEffect(() => {
    const currentTemplateId = template?.id || null
    const previousTemplateId = previousTemplateIdRef.current
    previousTemplateIdRef.current = currentTemplateId

    if (previousTemplateId === currentTemplateId) return
    if (previousTemplateId === null && currentTemplateId === null) return

    setCloserPresetModalOpen(false)
    setPreviewModal({
      open: false,
      src: '',
      alt: '',
      title: '',
    })
    setLoading(false)
    setSaveLoading(false)
    setGeneratedPreview('')
    setGeneratedFile(null)
    setPrintExport(null)
    lastPrintExportErrorRef.current = ''
    lastPrintExportReadyRef.current = ''
    setSaveToGallery(false)
    setImageTitle('')
    setExtraPrompt('')
    resetMaskState()
    setClientFile(null)
    setClientPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [template?.id])

  const selectionComparison = useMemo(() => {
    if (!template) return null

    const afterUrl = String(
      template.afterPreviewUrl ||
        template.previewUrl ||
        template.resultImageUrl ||
        '',
    ).trim()

    let beforeUrl = String(
      template.beforePreviewUrl || template.sourceImageUrl || '',
    ).trim()

    if (!beforeUrl && template.previewSourceKey) {
      beforeUrl = String(PROTOTYPE_MAP[template.previewSourceKey] || '').trim()
    }

    if (!beforeUrl || !afterUrl) return null

    const modeLabels = isPhotoLab
      ? getModePreviewLabels(modeKey || template.id)
      : { before: 'Before', after: 'After' }

    return {
      beforeUrl,
      afterUrl,
      beforeLabel: template.beforePreviewLabel || modeLabels.before,
      afterLabel: template.afterPreviewLabel || modeLabels.after,
    }
  }, [isPhotoLab, modeKey, template])

  useEffect(() => {
    setComparisonSliderPosition(100)
  }, [template?.id, selectionComparison?.beforeUrl, selectionComparison?.afterUrl])

  const previousRestoreStyleRef = useRef(restoreStyle)

  useEffect(() => {
    if (!isRestoreColorizeMode) {
      previousRestoreStyleRef.current = restoreStyle
      return
    }

    if (previousRestoreStyleRef.current === restoreStyle) return

    previousRestoreStyleRef.current = restoreStyle
    setGeneratedPreview('')
    setGeneratedFile(null)
  }, [isRestoreColorizeMode, restoreStyle])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (clientPreview) URL.revokeObjectURL(clientPreview)

    setClientFile(file)
    setClientPreview(URL.createObjectURL(file))
    setGeneratedPreview('')
    setGeneratedFile(null)
    resetMaskState()

    e.target.value = ''
  }

  const trimmedExtraPrompt = String(extraPrompt || '').trim()
  const canRunRemoveObjects = hasRemovalMask || Boolean(trimmedExtraPrompt)

  const runGeneration = async (presetOverride) => {
    if (!clientFile || !template?.id) return

    if (isRemoveObjectsMode && !canRunRemoveObjects) {
      return
    }

    const activePreset = presetOverride || modelPreset || DEFAULT_MODEL_PRESET

    if (presetOverride && presetOverride !== modelPreset) {
      setModelPreset(presetOverride)
    }

    setLoading(true)
    setPrintExport(null)
    lastPrintExportErrorRef.current = ''
    lastPrintExportReadyRef.current = ''

    try {
      if (isPhotoLab) {
        const formData = new FormData()

        formData.append('mode', template.id)
        formData.append('photo', clientFile)

        let normalizedExtraPrompt = String(extraPrompt || '').trim()

        const currentLangCode =
          languagesAndCodes?.languages?.[languageIndex]?.code || 'en'

        if (normalizedExtraPrompt && currentLangCode !== 'en') {
          normalizedExtraPrompt = await translateTextTo(
            normalizedExtraPrompt,
            'en',
            currentLangCode,
          )
        }

        formData.append('extraPrompt', normalizedExtraPrompt)
        formData.append('photoQuality', photoQuality)
        if (showOutputFormat && outputFormat) {
          formData.append('outputFormat', outputFormat)
        }
        formData.append('modelPreset', activePreset)
        formData.append('aiModel', aiModel || 'classic')
        formData.append('isRegeneration', generatedPreview ? 'true' : 'false')

        if (
          (modeKey || template.id) === RESTORE_COLORIZE_MODE &&
          restoreStyle
        ) {
          formData.append('restoreStyle', restoreStyle)
        } else if ((modeKey || template.id) === RESTORE_COLORIZE_MODE) {
          formData.append('restoreStyle', DEFAULT_RESTORE_STYLE)
        }

        if (!isLogin && visitorId) {
          formData.append('visitorId', visitorId)
        }

        if (isRemoveObjectsMode) {
          const maskBlob = await maskEditorRef.current?.exportMask()

          if (maskBlob) {
            formData.append('mask', maskBlob, 'photo-lab-mask.png')
          }
        }

        const result = await dispatch(
          generatePhotoLabClientImage(formData),
        ).unwrap()

        applyGenerationResult(result)

        return
      }

      const formData = new FormData()

      formData.append('templateId', template.id)
      formData.append('photo', clientFile)

      let normalizedExtraPrompt = String(extraPrompt || '').trim()

      const currentLangCode =
        languagesAndCodes?.languages?.[languageIndex]?.code || 'en'

      if (normalizedExtraPrompt && currentLangCode !== 'en') {
        normalizedExtraPrompt = await translateTextTo(
          normalizedExtraPrompt,
          'en',
          currentLangCode,
        )
      }

      formData.append('extraPrompt', normalizedExtraPrompt)
      formData.append('outputFormat', outputFormat)
      formData.append('photoQuality', photoQuality)
      formData.append('modelPreset', activePreset)
      formData.append('aiModel', aiModel || 'classic')
      formData.append('isRegeneration', generatedPreview ? 'true' : 'false')

      if (!isLogin && visitorId) {
        formData.append('visitorId', visitorId)
      }

      const result = await dispatch(
        generateYourLookClientImage(formData),
      ).unwrap()

      applyGenerationResult(result)
    } catch (error) {
      dispatch(getGenerationUsage())

      const errorMessage =
        String(error?.data?.message || error?.message || '').trim() ||
        'Generation failed. Please try again.'

      if (isPhotoLab) {
        dispatch(setPhotoLabError(errorMessage))
      } else {
        dispatch(setReadyTemplateError(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }

  const shouldOfferCloserPreset =
    Boolean(generatedPreview) &&
    modelPreset === BALANCED_MODEL_PRESET &&
    showModelPreset &&
    isModelPresetAllowed('identity') &&
    closerPresetCreditDelta > 0

  const handleGenerateClick = () => {
    if (!clientFile || !template?.id) return
    if (isRemoveObjectsMode && !canRunRemoveObjects) return

    if (shouldOfferCloserPreset) {
      setCloserPresetModalOpen(true)
      return
    }

    runGeneration()
  }

  const handleCloserPresetApply = () => {
    setCloserPresetModalOpen(false)
    runGeneration('identity')
  }

  const handleCloserPresetDecline = () => {
    setCloserPresetModalOpen(false)
    runGeneration(BALANCED_MODEL_PRESET)
  }

  const downloadGeneratedImage = (
    downloadUrl = generatedPreview,
    forcedFormat = generatedImageFormat,
  ) => {
    if (!downloadUrl) return

    const fileFormat = getGeneratedImageFormat(forcedFormat)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${imageTitle?.trim() || 'generated-image'}.${
      fileFormat.extension
    }`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const buildPreviewFile = (normalizedTitle) => {
    if (generatedFile) {
      return generatedFile
    }

    return dataUrlToFile(
      generatedPreview,
      `${normalizedTitle}-preview.webp`,
    )
  }

  const buildGeneratedImageFormData = (shouldSaveToGallery) => {
    const fallbackTitle = template?.title
      ? `${template.title} result`
      : isPhotoLab
        ? 'Photo Lab result'
        : 'My generated look'

    const normalizedTitle = String(imageTitle || '').trim() || fallbackTitle

    const formData = new FormData()

    formData.append('title', normalizedTitle)
    formData.append(
      'sourceType',
      resolveGallerySourceType({
        productKey,
        modeKey: activeModeId,
        restoreStyle,
      }),
    )
    formData.append('templateId', template.id)
    formData.append('extraPrompt', extraPrompt || '')
    formData.append('outputFormat', outputFormat || '')
    formData.append('photoQuality', photoQuality || '')
    formData.append('fileFormat', generatedImageFormat || 'png')
    formData.append('saveToGallery', shouldSaveToGallery ? 'true' : 'false')

    if (shouldSaveToGallery) {
      formData.append('previewImage', buildPreviewFile(normalizedTitle))
    }

    const file =
      generatedFile || dataUrlToFile(generatedPreview, `${normalizedTitle}.png`)

    formData.append('image', file)

    return {
      formData,
      normalizedTitle,
    }
  }

  const downloadFromBlob = (blob, normalizedTitle, extension) => {
    const objectUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${normalizedTitle}.${extension}`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 1000)
  }

  const fetchPrintExportBlob = async (normalizedTitle) => {
    const { blob } = await axiosDownloadPrintExportFile(printExport.jobId, {
      visitorId: isLogin ? '' : visitorId,
      title: normalizedTitle,
    })

    return blob
  }

  const handleDownloadGeneratedImage = async () => {
    if (!generatedPreview) return

    const isPrintExportReady =
      printExport?.status === 'ready' && Boolean(printExport?.downloadUrl)

    if (printExport && !isPrintExportReady) return

    const fallbackTitle = template?.title
      ? `${template.title} result`
      : isPhotoLab
        ? 'Photo Lab result'
        : 'My generated look'

    const normalizedTitle = String(imageTitle || '').trim() || fallbackTitle

    setSaveLoading(true)

    try {
      if (isPrintExportReady) {
        const printBlob = await fetchPrintExportBlob(normalizedTitle)

        if (isLogin && saveToGallery) {
          const saveFormData = buildGeneratedImageFormData(true).formData

          saveFormData.set('fileFormat', 'png')
          saveFormData.set('printExportJobId', printExport.jobId)
          saveFormData.delete('image')

          await dispatch(createGeneratedImage(saveFormData)).unwrap()
        }

        downloadFromBlob(printBlob, normalizedTitle, 'png')

        if (!isLogin || !saveToGallery) {
          await axiosDiscardPrintExportJob(
            printExport.jobId,
            isLogin ? '' : visitorId,
          )
          setPrintExport(null)
        }

        return
      }

      if (!isLogin) {
        downloadGeneratedImage()
        return
      }

      if (saveToGallery) {
        const { formData: saveFormData } = buildGeneratedImageFormData(true)
        await dispatch(createGeneratedImage(saveFormData)).unwrap()
      }

      const { formData: downloadFormData, normalizedTitle: downloadTitle } =
        buildGeneratedImageFormData(false)

      const convertedImage =
        await axiosCreateGeneratedImageFile(downloadFormData)

      const fileFormat = getGeneratedImageFormat(
        convertedImage?.fileFormat || generatedImageFormat,
      )

      const objectUrl = URL.createObjectURL(convertedImage.blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${downloadTitle}.${fileFormat.extension}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 1000)
    } catch (error) {
      const errorMessage =
        String(error?.data?.message || error?.message || '').trim() ||
        'Failed to save or download your image.'

      if (isPhotoLab) {
        dispatch(setPhotoLabError(errorMessage))
      } else {
        dispatch(setReadyTemplateError(errorMessage))
      }
    } finally {
      setSaveLoading(false)
    }
  }

  const renderPreviewCard = ({
    src,
    alt,
    eyebrow,
    title,
    description,
    empty = false,
    onPreview,
    action,
    borderClassName = 'border-white/10',
    imageFit = 'cover',
    imagePadding = true,
    children,
    titleTranslate = true,
  }) => {
    const useContain = imageFit === 'contain'

    return (
      <div
        className={`${WORKSPACE_PREVIEW_FRAME_CLASS} ${borderClassName}`}
      >
        {src && !empty ? (
          <>
            {!useContain ? (
              <>
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-110 object-cover object-[center_18%] opacity-25 blur-2xl"
                />

                <div className="absolute inset-0 bg-black/20" />
              </>
            ) : null}

            {useContain ? (
              imagePadding ? (
                <div className="absolute inset-0 z-[1] flex items-center justify-center p-3">
                  <img
                    src={src}
                    alt={alt}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <img
                  src={src}
                  alt={alt}
                  className="absolute inset-0 z-[1] h-full w-full object-contain"
                />
              )
            ) : (
              <img
                src={src}
                alt={alt}
                className="absolute inset-0 z-[1] h-full w-full object-cover object-[center_18%] transition duration-700 group-hover:scale-[1.018]"
              />
            )}

            {onPreview ? (
              <button
                type="button"
                onClick={onPreview}
                className="absolute right-3 top-3 z-[3] hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:bg-black/40 hover:text-white group-hover:opacity-100 lg:inline-flex"
                aria-label="Open image preview"
              >
                <Maximize2 size={15} />
              </button>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4">
              {eyebrow ? (
                <Text as="p" variant="caption" color="soft" caseMode="sentence">
                  {eyebrow}
                </Text>
              ) : null}

              <Text
                as="p"
                variant="body"
                color="white"
                translate={titleTranslate}
                className="mt-1 line-clamp-1"
              >
                {title}
              </Text>

              {description ? (
                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                  className="mt-1 line-clamp-1"
                >
                  {description}
                </Text>
              ) : null}

              {action ? <div className="mt-3">{action}</div> : null}
            </div>
          </>
        ) : (
          children
        )}
      </div>
    )
  }

  if (!template) {
    return (
      <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          {emptyStateTitle}
        </Text>

        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          {emptyStateDescription}
        </Text>
      </section>
    )
  }

  const resolvedPromptLabel = isRemoveObjectsMode
    ? 'Additional prompt'
    : promptLabel

  const resolvedPromptPlaceholder = isRemoveObjectsMode
    ? "Optional with a mask. Or prompt-only: remove the seagulls near the man's feet..."
    : template?.promptPlaceholder || promptPlaceholder

  const resolvedPromptHint = isPhotoLab
    ? ''
    : template?.promptHint || promptHint

  const resolvedWorkspaceDescription = isRemoveObjectsMode
    ? 'Upload your photo, paint a mask, describe what to remove, or both — then generate.'
    : isEnhanceQualityMode
      ? 'Upload your photo, choose likeness and export size, then generate a cleaner version of the same photo.'
      : workspaceDescription

  const isGenerateDisabled =
    !clientFile || (isRemoveObjectsMode && !canRunRemoveObjects)

  const resolvedActionCardLabels = {
    ...actionCardLabels,
    descriptionDisabled: isRemoveObjectsMode
      ? !clientFile
        ? 'Upload your photo first to continue.'
        : 'Paint a removal mask, add a prompt, or both before generating.'
      : actionCardLabels.descriptionDisabled,
  }

  const showSelectionPreview = Boolean(
    template?.previewUrl ||
      template?.afterPreviewUrl ||
      template?.beforePreviewUrl,
  )

  const renderSelectionPreviewCard = ({ onPreview, action } = {}) => {
    if (selectionComparison) {
      return (
        <div className={`${WORKSPACE_PREVIEW_FRAME_CLASS} border-white/10`}>
          <BeforeAfterComparisonSlider
            beforeSrc={selectionComparison.beforeUrl}
            afterSrc={selectionComparison.afterUrl}
            beforeLabel={selectionComparison.beforeLabel}
            afterLabel={selectionComparison.afterLabel}
            onPositionChange={setComparisonSliderPosition}
            showLabels={false}
            className="absolute inset-0"
          />

          {onPreview ? (
            <button
              type="button"
              onClick={() =>
                onPreview(
                  resolveComparisonPreviewTarget(
                    selectionComparison,
                    comparisonSliderPosition,
                    {
                      title: template.title || selectionEyebrow,
                    },
                  ),
                )
              }
              className="absolute right-3 top-3 z-[3] hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:bg-black/40 hover:text-white group-hover:opacity-100 lg:inline-flex"
              aria-label="Open image preview"
            >
              <Maximize2 size={15} />
            </button>
          ) : null}

          <ComparisonPreviewBadge
            beforeLabel={selectionComparison.beforeLabel}
            afterLabel={selectionComparison.afterLabel}
            position={comparisonSliderPosition}
            shineSeed={`${template.id}-${selectionComparison.afterUrl}`}
            wrapperClassName="pointer-events-none absolute bottom-4 right-4 z-[5]"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4">
            <Text as="p" variant="caption" color="soft" caseMode="sentence">
              {selectionEyebrow}
            </Text>

            <Text
              as="p"
              variant="body"
              color="white"
              className="mt-1 line-clamp-1"
            >
              {template.title}
            </Text>

            {template.category ? (
              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-1 line-clamp-1"
              >
                {template.category}
              </Text>
            ) : null}

            {action ? (
              <div className="pointer-events-auto mt-3">{action}</div>
            ) : null}
          </div>
        </div>
      )
    }

    if (!template?.previewUrl) return null

    return renderPreviewCard({
      src: template.previewUrl,
      alt: template.title,
      eyebrow: selectionEyebrow,
      title: template.title,
      description: template.category,
      onPreview: onPreview
        ? () =>
            onPreview({
              src: template.previewUrl,
              alt: template.title,
              title: template.title || selectionEyebrow,
            })
        : undefined,
      action,
    })
  }

  const showRemoveObjectsWorkspace = isRemoveObjectsMode && clientFile
  const showRestoreStyleWorkspace =
    isRestoreColorizeMode &&
    Boolean(clientFile) &&
    onRestoreStyleChange &&
    restoreStyle
  const showExpandedPhotoWorkspace =
    showRemoveObjectsWorkspace || showRestoreStyleWorkspace

  const toolbarColumnClassName = showSelectionPreview
    ? 'md:col-start-1 lg:col-start-2 lg:row-start-1'
    : 'md:col-start-1 lg:row-start-1'

  const uploadPhotoColumnClassName = showSelectionPreview
    ? 'md:col-start-1 lg:col-start-2 lg:row-start-2'
    : 'md:col-start-1 lg:row-start-2'

  const resultPhotoColumnClassName = showSelectionPreview
    ? 'md:col-start-2 lg:col-start-3 lg:row-start-2'
    : 'md:col-start-2 lg:row-start-2'

  const renderStandardResultPreview = () =>
    generatedPreview
      ? renderPreviewCard({
          src: generatedPreview,
          alt: 'Generated result',
          eyebrow: 'AI generated result',
          title: isRemoveObjectsMode
            ? 'Your edited photo is ready'
            : 'Your new look is ready',
          onPreview: () =>
            openImagePreview({
              src: generatedPreview,
              alt: 'Generated result',
              title: imageTitle || 'Generated result',
            }),
        })
      : renderPreviewCard({
          empty: true,
          children: (
            <div className="px-6 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
                <Sparkles size={24} />
              </span>

              <Text as="p" variant="body" color="white" caseMode="sentence">
                Result preview
              </Text>

              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-2 max-w-[260px]"
              >
                {isRemoveObjectsMode
                  ? 'Paint a mask, add a prompt, or both, then click generate.'
                  : 'Upload your photo and click generate to create your AI result.'}
              </Text>
            </div>
          ),
        })

  const renderStandardUploadPhotoCard = () => {
    if (isRemoveObjectsMode) {
      return renderPreviewCard({
        empty: true,
        borderClassName: 'border-dashed border-white/15',
        children: (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group flex h-full w-full flex-col items-center justify-center p-5 text-center transition hover:bg-white/[0.035]"
          >
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
              <ImagePlus size={24} />
            </span>

            <Text as="span" variant="body" color="white" caseMode="sentence">
              Upload your photo
            </Text>

            <Text
              as="span"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-2 max-w-[260px]"
            >
              Upload a photo, then paint a mask and/or describe what to remove.
            </Text>
          </button>
        ),
      })
    }

    if (clientPreview) {
      return renderPreviewCard({
        src: clientPreview,
        alt: 'Uploaded photo',
        eyebrow: 'Uploaded photo',
        title: clientFile?.name || 'Uploaded photo',
        titleTranslate: !clientFile?.name,
        borderClassName: 'border-dashed border-white/15',
        onPreview: () =>
          openImagePreview({
            src: clientPreview,
            alt: 'Uploaded photo',
            title: clientFile?.name || 'Uploaded photo',
          }),
        action: (
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
            className="h-[38px] rounded-full border-white/10 bg-white/[0.08] px-5 hover:bg-white/[0.12]"
          >
            Change photo
          </Button>
        ),
      })
    }

    return renderPreviewCard({
      empty: true,
      borderClassName: 'border-dashed border-white/15',
      children: (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex h-full w-full flex-col items-center justify-center p-5 text-center transition hover:bg-white/[0.035]"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
            <ImagePlus size={24} />
          </span>

          <Text as="span" variant="body" color="white" caseMode="sentence">
            Upload your photo
          </Text>

          <Text
            as="span"
            variant="caption"
            color="muted"
            caseMode="sentence"
            className="mt-2 max-w-[230px]"
          >
            Choose a clear portrait photo for the best result.
          </Text>
        </button>
      ),
    })
  }

  const renderRemoveObjectsResultPreview = () =>
    generatedPreview
      ? renderPreviewCard({
          src: generatedPreview,
          alt: 'Generated result',
          eyebrow: 'AI generated result',
          title: 'Your edited photo is ready',
          onPreview: () =>
            openImagePreview({
              src: generatedPreview,
              alt: 'Generated result',
              title: imageTitle || 'Generated result',
            }),
        })
      : renderPreviewCard({
          empty: true,
          children: (
            <div className="px-6 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
                <Sparkles size={24} />
              </span>

              <Text as="p" variant="body" color="white" caseMode="sentence">
                Result preview
              </Text>

              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-2 max-w-[260px]"
              >
                Paint a mask, add a prompt, or both, then click generate.
              </Text>
            </div>
          ),
        })

  const renderRemoveObjectsMaskFrame = () => (
    <div
      className={`${WORKSPACE_PREVIEW_FRAME_CLASS} border-dashed border-white/15`}
    >
      <PhotoLabMaskEditor
        key={
          clientFile
            ? `${clientFile.name}-${clientFile.lastModified}-${clientFile.size}`
            : 'no-file'
        }
        ref={maskEditorRef}
        imageFile={clientFile}
        brushSize={maskBrushSize}
        tool={maskTool}
        paintActive={maskPaintActive}
        onPanModeEnter={() => setMaskPaintActive(false)}
        onFitView={() => setMaskPaintActive(true)}
        onZoomChange={setMaskZoomState}
        disabled={loading}
        onHasMaskChange={setHasRemovalMask}
        fillContainer
        viewportPadding={0}
        className="absolute inset-0 h-full w-full"
      />

      <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4">
        <Text as="p" variant="caption" color="soft" caseMode="sentence">
          Uploaded photo
        </Text>

        <Text
          as="p"
          variant="body"
          color="white"
          caseMode="sentence"
          className="mt-1 line-clamp-1"
          translate={false}
        >
          {clientFile?.name || 'Uploaded photo'}
        </Text>

        <div className="mt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="h-[38px] rounded-full border-white/10 bg-white/[0.08] px-5 hover:bg-white/[0.12]"
          >
            Change photo
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
      <div className="mb-6">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          {workspaceTitle}
        </Text>

        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          {resolvedWorkspaceDescription}
        </Text>
      </div>

      <div
        className={clsx(
          'mb-5 grid items-stretch gap-5',
          showExpandedPhotoWorkspace
            ? clsx('grid-cols-1 md:grid-cols-2', showSelectionPreview && 'lg:grid-cols-3')
            : clsx('md:grid-cols-2', showSelectionPreview && 'lg:grid-cols-3'),
        )}
      >
        {showExpandedPhotoWorkspace ? (
          <>
            {showSelectionPreview ? (
              <div className="hidden min-w-0 lg:col-start-1 lg:row-start-2 lg:block">
                {renderSelectionPreviewCard({
                  onPreview: ({ src, alt, title }) =>
                    openImagePreview({ src, alt, title }),
                })}
              </div>
            ) : null}

            {showRemoveObjectsWorkspace ? (
              <div
                className={clsx('flex min-w-0 flex-col gap-3', toolbarColumnClassName)}
              >
                <PhotoLabMaskToolbar
                  showTitle={false}
                  maskEditorRef={maskEditorRef}
                  maskTool={maskTool}
                  onMaskToolChange={setMaskTool}
                  maskPaintActive={maskPaintActive}
                  onMaskPaintActiveChange={setMaskPaintActive}
                  maskBrushSize={maskBrushSize}
                  onMaskBrushSizeChange={setMaskBrushSize}
                  maskZoomState={maskZoomState}
                  disabled={loading}
                  onClearMask={() => {
                    setHasRemovalMask(false)
                    setGeneratedPreview('')
                  }}
                />

                {!maskPaintActive && maskZoomState.zoom > 1 ? (
                  <Text
                    as="p"
                    variant="caption"
                    color="muted"
                    caseMode="sentence"
                    className="text-center"
                  >
                    Drag the photo to move it. Tap Brush to paint again.
                  </Text>
                ) : null}
              </div>
            ) : null}

            {showRestoreStyleWorkspace ? (
              <div className={clsx('min-w-0 overflow-visible', toolbarColumnClassName)}>
                <RestoreStyleToolbar
                  restoreStyle={restoreStyle}
                  onRestoreStyleChange={onRestoreStyleChange}
                  disabled={loading}
                  showTitle={false}
                />
              </div>
            ) : null}

            <div className={clsx('min-w-0', uploadPhotoColumnClassName)}>
              {showRemoveObjectsWorkspace
                ? renderRemoveObjectsMaskFrame()
                : renderStandardUploadPhotoCard()}
            </div>

            <div
              ref={resultRef}
              className={clsx('min-w-0', resultPhotoColumnClassName)}
            >
              {showRemoveObjectsWorkspace
                ? renderRemoveObjectsResultPreview()
                : renderStandardResultPreview()}
            </div>
          </>
        ) : (
          <>
            {showSelectionPreview ? (
              <div className="hidden lg:block">
                {renderSelectionPreviewCard({
                  onPreview: ({ src, alt, title }) =>
                    openImagePreview({ src, alt, title }),
                })}
              </div>
            ) : null}

            {renderStandardUploadPhotoCard()}

            <div ref={resultRef} className="flex min-h-0 flex-col">
              {renderStandardResultPreview()}
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        <div className="flex h-full min-h-[360px] flex-col rounded-[26px] border border-white/10 bg-white/[0.025] p-5">
          <Input
            as="textarea"
            rows={5}
            label={resolvedPromptLabel}
            labelClassName="text-lg font-semibold text-white md:text-xl"
            placeholder={resolvedPromptPlaceholder}
            hint={resolvedPromptHint}
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            caseMode="sentence"
            className="flex h-full min-h-0 flex-1 flex-col [&>div]:flex [&>div]:min-h-0 [&>div]:flex-1"
            inputClassName="h-full min-h-0 flex-1 resize-none"
            helpClassName={resolvedPromptHint ? undefined : 'hidden'}
          />
        </div>

        <div className="flex flex-col gap-3">
          <GenerationOptionsPanel
            extraPrompt={extraPrompt}
            setExtraPrompt={setExtraPrompt}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
            photoQuality={photoQuality}
            setPhotoQuality={setPhotoQuality}
            outputFormats={outputFormats}
            photoQualities={photoQualities}
            isFormatAllowed={isFormatAllowed}
            isQualityAllowed={isQualityAllowed}
            lockedText={lockedText}
            showPrompt={false}
            showOutputFormat={showOutputFormat}
            showAiModel={showAiModel}
            aiModel={aiModel}
            setAiModel={setAiModel}
            aiModels={aiModels}
            isAiModelAllowed={isAiModelAllowed}
            showModelPreset={showModelPreset}
            modelPreset={modelPreset}
            setModelPreset={setModelPreset}
            modelPresets={modelPresets}
            isModelPresetAllowed={isModelPresetAllowed}
            photoQualityLabel="Export size"
          />
        </div>

        <GenerationActionCard
          generatedPreview={generatedPreview}
          loading={loading}
          disabled={isGenerateDisabled}
          onGenerate={handleGenerateClick}
          onDownload={handleDownloadGeneratedImage}
          planHint={planHint}
          isLogin={isLogin}
          saveToGallery={saveToGallery}
          setSaveToGallery={setSaveToGallery}
          imageTitle={imageTitle}
          setImageTitle={setImageTitle}
          saveLoading={saveLoading}
          generatedImageFormat={generatedImageFormat}
          setGeneratedImageFormat={setGeneratedImageFormat}
          generatedImageFormats={generatedImageFormats}
          isGeneratedImageFormatAllowed={isGeneratedImageFormatAllowed}
          formatLockedText={lockedText}
          creditCost={creditCost}
          printExportProcessing={printExport?.status === 'processing'}
          printExportProgress={
            printExport?.status === 'processing'
              ? typeof printExport?.progress === 'number'
                ? printExport.progress
                : 0
              : null
          }
          downloadDisabled={
            Boolean(printExport) && printExport?.status !== 'ready'
          }
          isPrintExport={photoQuality === 'print'}
          {...resolvedActionCardLabels}
        />
      </div>

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closeImagePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />

      <GenerationCloserPresetModal
        open={closerPresetModalOpen}
        creditDelta={closerPresetCreditDelta}
        loading={loading}
        onApply={handleCloserPresetApply}
        onDecline={handleCloserPresetDecline}
      />
    </section>
  )
}
