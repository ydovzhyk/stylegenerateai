'use client'

import { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { generateYourLookClientImage } from '@/store/ready-template/ready-template-operations'
import { getGenerationUsage } from '@/store/generation-usage/generation-usage-operations'
import { createGeneratedImage } from '@/store/generated-image/generated-image-operations'
import { axiosCreateGeneratedImageFile } from '@/services/api/generated-image'
import { getVisitorId } from '@/store/visitor/visitor-selectors'
import { dataUrlToFile } from '@/utils/files/dataUrlToFile'
import { getGeneratedImageFormat } from '@/constants/generated-image-formats'
import useGenerationPlanAccess from '@/hooks/useGenerationPlanAccess'
import Text from '@/components/shared/text/Text'
import GenerationOptionsPanel from '@/components/shared/generation/GenerationOptionsPanel'
import GenerationActionCard from '@/components/shared/generation/GenerationActionCard'

import { ImagePlus, Sparkles } from 'lucide-react'

export default function CreateYourLookGenerateClientImage({ template }) {
  const inputRef = useRef(null)
  const dispatch = useDispatch()
  const visitorId = useSelector(getVisitorId)

  const [saveToGallery, setSaveToGallery] = useState(false)
  const [imageTitle, setImageTitle] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

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
    generatedImageFormat,
    setGeneratedImageFormat,
    generatedImageFormats,
    isGeneratedImageFormatAllowed,
  } = useGenerationPlanAccess()

  const [clientFile, setClientFile] = useState(null)
  const [clientPreview, setClientPreview] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [generatedPreview, setGeneratedPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedFile, setGeneratedFile] = useState(null)
  const resultRef = useRef(null)
  const previousTemplateIdRef = useRef(null)

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

  useEffect(() => {
    return () => {
      if (clientPreview) URL.revokeObjectURL(clientPreview)
    }
  }, [clientPreview])

  useEffect(() => {
    if (!template?.id) return

    const previousTemplateId = previousTemplateIdRef.current
    previousTemplateIdRef.current = template.id

    if (!previousTemplateId || previousTemplateId === template.id) return

    setGeneratedPreview('')
    setGeneratedFile(null)
    setSaveToGallery(false)
    setImageTitle('')
    setExtraPrompt('')
  }, [template?.id])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (clientPreview) URL.revokeObjectURL(clientPreview)

    setClientFile(file)
    setClientPreview(URL.createObjectURL(file))
    setGeneratedPreview('')
    setGeneratedFile(null)
  }

  const handleGenerate = async () => {
    if (!clientFile || !template?.id) return

    setLoading(true)

    try {
      const formData = new FormData()

      formData.append('templateId', template.id)
      formData.append('photo', clientFile)
      formData.append('extraPrompt', String(extraPrompt || '').trim())
      formData.append('outputFormat', outputFormat)
      formData.append('photoQuality', photoQuality)
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
    formData.append('sourceType', 'create_your_look')
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

    const convertedImage = await axiosCreateGeneratedImageFile(downloadFormData)

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

  if (!template) {
    return (
      <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          Generate your image
        </Text>

        <Text className="mt-3 max-w-2xl" color="muted">
          Choose a template above to start generating your personalized look.
        </Text>
      </section>
    )
  }

  return (
    <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
      <div className="mb-6">
        <Text as="h2" variant="h2" color="white">
          Generate your image
        </Text>

        <Text className="mt-3 max-w-2xl" color="muted">
          Upload your own photo and apply the selected AI template.
        </Text>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4">
            <Text as="p" variant="caption" color="soft" caseMode="sentence">
              Selected template
            </Text>

            <Text
              as="h3"
              variant="body"
              color="white"
              caseMode="sentence"
              className="mt-1"
            >
              {template.title}
            </Text>

            {template.category ? (
              <Text
                as="p"
                variant="caption"
                color="muted"
                caseMode="sentence"
                className="mt-1"
              >
                {template.category}
              </Text>
            ) : null}
          </div>

          <div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-background-soft sm:h-[460px] lg:h-[560px]">
            <img
              src={template.previewUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
            />

            <div className="absolute inset-0 bg-black/20" />

            <img
              src={template.previewUrl}
              alt={template.title}
              className="relative z-[1] h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4">
            <Text as="p" variant="caption" color="soft" caseMode="sentence">
              AI generated result
            </Text>

            <Text
              as="h3"
              variant="body"
              color="white"
              caseMode="sentence"
              className="mt-1"
            >
              {generatedPreview
                ? 'Your new look is ready'
                : 'Waiting for generation'}
            </Text>

            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-1"
            >
              The final image will appear here after generation.
            </Text>
          </div>

          <div
            ref={resultRef}
            className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-background-soft/70 sm:h-[460px] lg:h-[560px]"
          >
            {generatedPreview ? (
              <>
                <img
                  src={generatedPreview}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
                />

                <div className="absolute inset-0 bg-black/20" />

                <img
                  src={generatedPreview}
                  alt="Generated result"
                  className="relative z-[1] h-full w-full object-contain"
                />
              </>
            ) : (
              <div className="px-6 text-center">
                <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
                  <Sparkles size={26} />
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
                  Upload your photo and click generate to create your AI result.
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr_260px]">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative min-h-[260px] overflow-hidden rounded-[26px] border border-dashed border-white/15 bg-white/[0.025] p-5 transition hover:border-primary/40 hover:bg-white/[0.04]"
        >
          {clientPreview ? (
            <>
              <img
                src={clientPreview}
                alt="Uploaded photo"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 z-[2] p-4">
                <Text
                  as="p"
                  variant="caption"
                  color="white"
                  translate={false}
                  className="truncate"
                >
                  {clientFile?.name}
                </Text>

                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                  className="mt-1"
                >
                  Click to change photo
                </Text>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
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
                className="mt-2 max-w-[210px]"
              >
                Choose a clear portrait photo for the best result.
              </Text>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </button>

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
        />

        <GenerationActionCard
          generatedPreview={generatedPreview}
          loading={loading}
          disabled={!clientFile}
          onGenerate={handleGenerate}
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
        />
      </div>
    </section>
  )
}