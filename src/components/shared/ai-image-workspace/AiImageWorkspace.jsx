'use client'

import GenerationActionCard from '@/components/shared/ai-image-workspace/GenerationActionCard'
import GenerationCloserPresetModal from '@/components/shared/ai-image-workspace/GenerationCloserPresetModal'
import GenerationOptionsPanel from '@/components/shared/ai-image-workspace/GenerationOptionsPanel'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Text from '@/components/shared/text/Text'
import { DEFAULT_MODEL_PRESET } from '@/constants/model-presets'
import { DEFAULT_RESTORE_STYLE, RESTORE_COLORIZE_MODE } from '@/constants/restore-styles'
import { getGeneratedImageFormat } from '@/constants/generated-image-formats'
import useGenerationPlanAccess from '@/hooks/useGenerationPlanAccess'
import { useLanguage } from '@/providers/languageContext'
import { axiosCreateGeneratedImageFile } from '@/services/api/generated-image'
import { createGeneratedImage } from '@/store/generated-image/generated-image-operations'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import { generateYourLookClientImage } from '@/store/ready-template/ready-template-operations'
import { generatePhotoLabClientImage } from '@/store/photo-lab/photo-lab-operations'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { dataUrlToFile } from '@/utils/files/dataUrlToFile'
import languagesAndCodes from '@/utils/translate/languagesAndCodes'
import { translateTextTo } from '@/utils/translate/translate'
import { ImagePlus, Maximize2, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const DEFAULT_ACTION_CARD_LABELS = {}

export default function AiImageWorkspace({
  template,
  productKey = 'create_your_look',
  modeKey,
  restoreStyle = null,
  onChangeRestoreStyle = null,
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
  const previousTemplateIdRef = useRef(null)

  const dispatch = useDispatch()
  const visitorId = useSelector(getVisitorId)

  const [clientFile, setClientFile] = useState(null)
  const [clientPreview, setClientPreview] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [generatedPreview, setGeneratedPreview] = useState('')
  const [generatedFile, setGeneratedFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const [saveToGallery, setSaveToGallery] = useState(false)
  const [imageTitle, setImageTitle] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [closerPresetModalOpen, setCloserPresetModalOpen] = useState(false)

  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  const { languageIndex } = useLanguage()

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
    closerPresetCreditDelta,
    generatedImageFormat,
    setGeneratedImageFormat,
    generatedImageFormats,
    isGeneratedImageFormatAllowed,
  } = useGenerationPlanAccess(pricingContext)

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
    setSaveToGallery(false)
    setImageTitle('')
    setExtraPrompt('')
    setClientFile(null)
    setClientPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [template?.id])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (clientPreview) URL.revokeObjectURL(clientPreview)

    setClientFile(file)
    setClientPreview(URL.createObjectURL(file))
    setGeneratedPreview('')
    setGeneratedFile(null)

    e.target.value = ''
  }

  const runGeneration = async (presetOverride) => {
    if (!clientFile || !template?.id) return

    const activePreset = presetOverride || modelPreset || DEFAULT_MODEL_PRESET

    if (presetOverride && presetOverride !== modelPreset) {
      setModelPreset(presetOverride)
    }

    setLoading(true)

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

        const result = await dispatch(
          generatePhotoLabClientImage(formData),
        ).unwrap()

        const previewUrl =
          result?.previewUrl ||
          result?.result?.previewUrl ||
          result?.value?.previewUrl ||
          ''

        if (previewUrl) {
          setGeneratedPreview(previewUrl)
          setImageTitle(
            template?.title ? `${template.title} result` : 'Photo Lab result',
          )
          setSaveToGallery(false)

          requestAnimationFrame(() => {
            scrollToResult()
          })

          if (isLogin) {
            dispatch(getGenerationUsage())
          } else if (visitorId) {
            dispatch(getGenerationUsage())
          }

          if (previewUrl.startsWith('data:')) {
            setGeneratedFile(dataUrlToFile(previewUrl, 'photo-lab-result.png'))
          } else {
            setGeneratedFile(null)
          }
        }

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
      formData.append('isRegeneration', generatedPreview ? 'true' : 'false')

      if (!isLogin && visitorId) {
        formData.append('visitorId', visitorId)
      }

      const result = await dispatch(
        generateYourLookClientImage(formData),
      ).unwrap()

      const previewUrl =
        result?.previewUrl ||
        result?.result?.previewUrl ||
        result?.value?.previewUrl ||
        ''

      if (previewUrl) {
        setGeneratedPreview(previewUrl)

        setImageTitle(
          template?.title ? `${template.title} result` : 'My generated look',
        )
        setSaveToGallery(false)

        requestAnimationFrame(() => {
          scrollToResult()
        })

        if (isLogin) {
          dispatch(getGenerationUsage())
        } else if (visitorId) {
          dispatch(getGenerationUsage())
        }

        if (previewUrl.startsWith('data:')) {
          setGeneratedFile(dataUrlToFile(previewUrl, 'your-look-result.png'))
        } else {
          setGeneratedFile(null)
        }
      }
    } catch (error) {
      dispatch(getGenerationUsage())
    } finally {
      setLoading(false)
    }
  }

  const shouldOfferCloserPreset =
    Boolean(generatedPreview) &&
    modelPreset === DEFAULT_MODEL_PRESET &&
    showModelPreset &&
    isModelPresetAllowed('identity') &&
    closerPresetCreditDelta > 0

  const handleGenerateClick = () => {
    if (!clientFile || !template?.id) return

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
    runGeneration(DEFAULT_MODEL_PRESET)
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

  const buildGeneratedImageFormData = (shouldSaveToGallery) => {
    const fallbackTitle = template?.title
      ? `${template.title} result`
      : 'My generated look'

    const normalizedTitle = String(imageTitle || '').trim() || fallbackTitle

    const formData = new FormData()

    formData.append('title', normalizedTitle)
    formData.append(
      'sourceType',
      isPhotoLab ? 'photo_lab' : 'create_your_look',
    )
    formData.append('templateId', template.id)
    formData.append('extraPrompt', extraPrompt || '')
    formData.append('outputFormat', outputFormat || '')
    formData.append('photoQuality', photoQuality || '')
    formData.append('fileFormat', generatedImageFormat || 'png')
    formData.append('saveToGallery', shouldSaveToGallery ? 'true' : 'false')

    const file =
      generatedFile || dataUrlToFile(generatedPreview, `${normalizedTitle}.png`)

    formData.append('image', file)

    return {
      formData,
      normalizedTitle,
    }
  }

  const handleDownloadGeneratedImage = async () => {
    if (!generatedPreview) return

    if (!isLogin) {
      downloadGeneratedImage()
      return
    }

    setSaveLoading(true)

    try {
      if (saveToGallery) {
        const { formData: saveFormData } = buildGeneratedImageFormData(true)
        await dispatch(createGeneratedImage(saveFormData)).unwrap()
      }

      const { formData: downloadFormData, normalizedTitle } =
        buildGeneratedImageFormData(false)

      const convertedImage =
        await axiosCreateGeneratedImageFile(downloadFormData)

      const fileFormat = getGeneratedImageFormat(
        convertedImage?.fileFormat || generatedImageFormat,
      )

      const objectUrl = URL.createObjectURL(convertedImage.blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${normalizedTitle}.${fileFormat.extension}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 1000)
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
    children,
    titleTranslate = true,
  }) => {
    return (
      <div
        className={`group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[26px] border bg-background-soft/70 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:aspect-[5/6] lg:aspect-[4/5] ${borderClassName}`}
      >
        {src && !empty ? (
          <>
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover object-[center_18%] opacity-25 blur-2xl"
            />

            <div className="absolute inset-0 bg-black/20" />

            <img
              src={src}
              alt={alt}
              className="relative z-[1] h-full w-full object-cover object-[center_18%] transition duration-700 group-hover:scale-[1.018]"
            />

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

  const resolvedPromptPlaceholder =
    template?.promptPlaceholder || promptPlaceholder

  const resolvedPromptHint = template?.promptHint || promptHint

  const showSelectionPreview = Boolean(template.previewUrl)

  return (
    <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
      <div className="mb-6">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          {workspaceTitle}
        </Text>

        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          {workspaceDescription}
        </Text>
      </div>

      <div
        className={clsx(
          'mb-5 grid gap-5 md:grid-cols-2',
          showSelectionPreview ? 'lg:grid-cols-3' : 'lg:grid-cols-2',
        )}
      >
        {showSelectionPreview ? (
          <div className="hidden lg:block">
            {renderPreviewCard({
              src: template.previewUrl,
              alt: template.title,
              eyebrow: selectionEyebrow,
              title: template.title,
              description: template.category,
              onPreview: () =>
                openImagePreview({
                  src: template.previewUrl,
                  alt: template.title,
                  title: template.title || selectionEyebrow,
                }),
              action:
                onChangeRestoreStyle &&
                (modeKey || template?.id) === RESTORE_COLORIZE_MODE ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChangeRestoreStyle()
                    }}
                    className="h-[34px] rounded-full border-white/10 bg-white/[0.08] px-4 text-xs hover:bg-white/[0.12]"
                  >
                    Change restore type
                  </Button>
                ) : null,
            })}
          </div>
        ) : null}

        {clientPreview
          ? renderPreviewCard({
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
          : renderPreviewCard({
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

                  <Text
                    as="span"
                    variant="body"
                    color="white"
                    caseMode="sentence"
                  >
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
            })}

        <div ref={resultRef}>
          {generatedPreview
            ? renderPreviewCard({
                src: generatedPreview,
                alt: 'Generated result',
                eyebrow: 'AI generated result',
                title: 'Your new look is ready',
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

                    <Text
                      as="p"
                      variant="body"
                      color="white"
                      caseMode="sentence"
                    >
                      Result preview
                    </Text>

                    <Text
                      as="p"
                      variant="caption"
                      color="muted"
                      caseMode="sentence"
                      className="mt-2 max-w-[260px]"
                    >
                      Upload your photo and click generate to create your AI
                      result.
                    </Text>
                  </div>
                ),
              })}
        </div>

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
            label={promptLabel}
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
          showModelPreset={showModelPreset}
          modelPreset={modelPreset}
          setModelPreset={setModelPreset}
          modelPresets={modelPresets}
          isModelPresetAllowed={isModelPresetAllowed}
        />

        <GenerationActionCard
          generatedPreview={generatedPreview}
          loading={loading}
          disabled={!clientFile}
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
          {...actionCardLabels}
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
