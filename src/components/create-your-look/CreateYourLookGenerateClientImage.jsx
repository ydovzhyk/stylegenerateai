'use client'

import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { generateYourLookClientImage } from '@/store/ready-template/ready-template-operations'
import { getLogin } from '@/store/auth/auth-selectors'
import { dataUrlToFile } from '@/utils/files/dataUrlToFile'

import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'

import { ImagePlus, Sparkles, RotateCcw, Lock } from 'lucide-react'

import {
  OUTPUT_FORMATS,
  DEFAULT_OUTPUT_FORMAT,
} from '@/constants/output-formats'
import {
  PHOTO_QUALITIES,
  DEFAULT_PHOTO_QUALITY,
} from '@/constants/photo-quality'

const FREE_OUTPUT_FORMAT_IDS = [DEFAULT_OUTPUT_FORMAT]
const FREE_PHOTO_QUALITY_IDS = ['draft', DEFAULT_PHOTO_QUALITY]

function LockedHint() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 items-center">
      <Lock size={14} className="text-white/80" />

      <span className="absolute bottom-full right-0 mb-3 w-[230px] rounded-2xl border border-white/15 bg-[#090b14] px-3 py-2 text-center text-xs font-medium leading-5 text-white opacity-0 shadow-2xl shadow-black/40 transition group-hover/option:opacity-100">
        Sign in to unlock this option.
      </span>
    </span>
  )
}

export default function CreateYourLookGenerateClientImage({ template }) {
  const inputRef = useRef(null)
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)

  const [clientFile, setClientFile] = useState(null)
  const [clientPreview, setClientPreview] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [generatedPreview, setGeneratedPreview] = useState('')
  const [loading, setLoading] = useState(false)

  const [outputFormat, setOutputFormat] = useState(DEFAULT_OUTPUT_FORMAT)
  const [photoQuality, setPhotoQuality] = useState(DEFAULT_PHOTO_QUALITY)

  const [generatedFile, setGeneratedFile] = useState(null)

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

        if (previewUrl.startsWith('data:')) {
          setGeneratedFile(dataUrlToFile(previewUrl, 'your-look-result.png'))
        } else {
          setGeneratedFile(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const outputFormats = Object.values(OUTPUT_FORMATS)
  const photoQualities = Object.values(PHOTO_QUALITIES)

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

          <div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-background-soft/70 sm:h-[460px] lg:h-[560px]">
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

        <div className="rounded-[26px] border border-white/10 bg-white/[0.025] p-5">
          <Input
            as="textarea"
            rows={3}
            label="Additional prompt"
            placeholder="Add small details, mood, colors, or background..."
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            caseMode="sentence"
            inputClassName="min-h-[92px]"
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Text className="mb-2" variant="caption">
                Output format
              </Text>

              <div className="grid gap-2">
                {outputFormats.map((format) => {
                  const isLocked =
                    !isLogin && !FREE_OUTPUT_FORMAT_IDS.includes(format.id)
                  const isActive = outputFormat === format.id

                  return (
                    <button
                      key={format.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setOutputFormat(format.id)}
                      className={`group/option relative flex w-full items-center justify-between rounded-xl border px-3 py-2 pr-9 ${
                        isActive
                          ? 'border-primary/50 bg-primary/20'
                          : 'border-white/10'
                      } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span>{format.label}</span>
                      {isLocked ? <LockedHint /> : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Text className="mb-2" variant="caption">
                Photo quality
              </Text>

              <div className="grid gap-2">
                {photoQualities.map((quality) => {
                  const isLocked =
                    !isLogin && !FREE_PHOTO_QUALITY_IDS.includes(quality.id)
                  const isActive = photoQuality === quality.id

                  return (
                    <button
                      key={quality.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setPhotoQuality(quality.id)}
                      className={`group/option relative flex w-full items-center justify-between rounded-xl border px-3 py-2 pr-9 ${
                        isActive
                          ? 'border-primary/50 bg-primary/20'
                          : 'border-white/10'
                      } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span>{quality.label}</span>
                      {isLocked ? <LockedHint /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.025] p-5 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300">
            {generatedPreview ? (
              <RotateCcw size={24} />
            ) : (
              <Sparkles size={24} />
            )}
          </span>

          <Text as="p" variant="body" color="white" caseMode="sentence">
            {generatedPreview ? 'Generate again' : 'Ready to generate'}
          </Text>

          <Text
            as="p"
            variant="caption"
            color="muted"
            caseMode="sentence"
            className="mt-2 max-w-[190px]"
          >
            {clientFile
              ? 'Start AI generation with your uploaded photo.'
              : 'Upload your photo first to continue.'}
          </Text>

          <Button
            type="button"
            variant="primary"
            loading={loading}
            disabled={!clientFile}
            onClick={handleGenerate}
            className="mt-5 h-[44px] w-full rounded-full px-7"
          >
            <span className="inline-flex items-center gap-2">
              {generatedPreview ? (
                <RotateCcw size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {generatedPreview ? 'Regenerate' : 'Generate'}
            </span>
          </Button>

          {!isLogin ? (
            <Text
              as="p"
              variant="caption"
              color="muted"
              caseMode="sentence"
              className="mt-3 max-w-[210px]"
            >
              Sign in to unlock more formats and higher quality.
            </Text>
          ) : null}
        </div>
      </div>
    </section>
  )
}