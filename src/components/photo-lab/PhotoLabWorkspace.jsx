'use client'

import GenerationActionCard from '@/components/shared/ai-image-workspace/GenerationActionCard'
import GenerationOptionsPanel from '@/components/shared/ai-image-workspace/GenerationOptionsPanel'
import Text from '@/components/shared/text/Text'
import { getGeneratedImageFormat } from '@/constants/generated-image-formats'
import useGenerationPlanAccess from '@/hooks/useGenerationPlanAccess'
import { ImagePlus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function PhotoLabWorkspace({ selectedMode }) {
  const inputRef = useRef(null)
  const resultRef = useRef(null)

  const {
    isLogin,
    outputFormat,
    photoQuality,
    setPhotoQuality,
    photoQualities,
    lockedText,
    planHint,
    isQualityAllowed,
    creditCost,
    generatedImageFormat,
    setGeneratedImageFormat,
    generatedImageFormats,
    isGeneratedImageFormatAllowed,
  } = useGenerationPlanAccess({
    productKey: 'photo_lab',
    modeKey: selectedMode?.id,
  })

  const [clientFile, setClientFile] = useState(null)
  const [clientPreview, setClientPreview] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [generatedPreview, setGeneratedPreview] = useState('')
  const [generatedFile, setGeneratedFile] = useState(null)
  const [imageTitle, setImageTitle] = useState('')
  const [saveToGallery, setSaveToGallery] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

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
    setGeneratedPreview('')
    setGeneratedFile(null)
    setSaveToGallery(false)
    setImageTitle('')
    setExtraPrompt('')
  }, [selectedMode?.id])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (clientPreview) URL.revokeObjectURL(clientPreview)

    setClientFile(file)
    setClientPreview(URL.createObjectURL(file))
    setGeneratedPreview('')
    setGeneratedFile(null)
    setSaveToGallery(false)
    setImageTitle('')
  }

  const handleGenerate = async () => {
    if (!clientFile) return

    setLoading(true)

    try {
      // TODO: later replace with real photo-lab operation:
      // formData.append('mode', selectedMode.id)
      // formData.append('photo', clientFile)
      // formData.append('extraPrompt', normalizedExtraPrompt)
      // formData.append('outputFormat', outputFormat)
      // formData.append('photoQuality', photoQuality)

      await new Promise((resolve) => setTimeout(resolve, 900))

      const previewUrl = clientPreview

      setGeneratedPreview(previewUrl)
      setGeneratedFile(null)
      setImageTitle(`${selectedMode.title} result`)
      setSaveToGallery(false)

      requestAnimationFrame(() => {
        scrollToResult()
      })
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
    link.download = `${imageTitle?.trim() || 'photo-lab-result'}.${
      fileFormat.extension
    }`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadGeneratedImage = async () => {
    if (!generatedPreview) return

    setSaveLoading(true)

    try {
      // TODO: later use the same gallery/file conversion flow as Create Your Look.
      // For now this keeps UI behavior safe without backend.
      downloadGeneratedImage()
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
      <div className="mb-6">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          Edit your photo
        </Text>

        <Text className="mt-3 max-w-2xl" color="muted" caseMode="sentence">
          Upload your image, choose photo quality, describe the result you want,
          and generate your AI-enhanced version.
        </Text>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4">
            <Text as="p" variant="caption" color="soft" caseMode="sentence">
              Original photo
            </Text>

            <Text
              as="h3"
              variant="body"
              color="white"
              caseMode="sentence"
              className="mt-1"
            >
              {clientPreview ? 'Your uploaded image' : 'Waiting for upload'}
            </Text>

            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-1"
            >
              The uploaded photo will appear here before AI processing.
            </Text>
          </div>

          <div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-background-soft sm:h-[460px] lg:h-[560px]">
            {clientPreview ? (
              <>
                <img
                  src={clientPreview}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
                />

                <div className="absolute inset-0 bg-black/20" />

                <img
                  src={clientPreview}
                  alt="Uploaded photo"
                  className="relative z-[1] h-full w-full object-contain"
                />
              </>
            ) : (
              <div className="px-6 text-center">
                <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary-soft">
                  <ImagePlus size={26} />
                </span>

                <Text as="p" variant="body" color="white" caseMode="sentence">
                  Upload photo
                </Text>

                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                  className="mt-2 max-w-[260px]"
                >
                  Choose a photo to start working with Photo Lab.
                </Text>
              </div>
            )}
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
                ? 'Your edited photo is ready'
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
                Choose a clear photo for the best AI result.
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
          setOutputFormat={() => {}}
          photoQuality={photoQuality}
          setPhotoQuality={setPhotoQuality}
          outputFormats={[]}
          photoQualities={photoQualities}
          isFormatAllowed={() => true}
          isQualityAllowed={isQualityAllowed}
          lockedText={lockedText}
          showOutputFormat={false}
          promptLabel="Describe your edit"
          promptPlaceholder={selectedMode.promptPlaceholder}
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
          creditCost={creditCost}
          titleReady="Ready to edit"
          descriptionReady="Start AI editing with your uploaded photo."
          descriptionDisabled="Upload your photo first to continue."
          buttonGenerate="Generate"
          buttonRegenerate="Regenerate"
          buttonDownload="Download"
        />
      </div>
    </section>
  )
}
