'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import {
  createReadyTemplate,
  getCategories,
  resolvePromptMetadata,
  generateReadyTemplatePreview,
} from '@/store/ready-template/ready-template-operations'
import {
  getReadyTemplateCategories,
  getReadyTemplatePromtCategory,
  getReadyTemplateSuggestedTitle,
  getReadyTemplateSuggestedTags,
  getReadyTemplateResolveMetadataLoading,
} from '@/store/ready-template/ready-template-selectors'
import { clearResolvePromptMetadata } from '@/store/ready-template/ready-template-slice'

import { dataUrlToFile } from '@/utils/files/dataUrlToFile'

import ReadyTemplateAutogeneratePanel from '@/components/ready-template/ReadyTemplateAutogeneratePanel'

import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import Text from '@/components/shared/text/Text'
import TemplatePreviewGenerator from '@/components/ready-template/TemplatePreviewGenerator'
import { useTranslate } from '@/utils/translate/translate'

const DEFAULT_VALUES = {
  title: '',
  slug: '',
  category: '',
  tags: '',
  previewFile: null,
  previewSourceKey: '',
  useInCreateYourLook: false,
  basePrompt: '',
  isPublished: true,
}

function makeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function normalizeTags(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function validateTitle(value) {
  const title = String(value || '').trim()

  if (!title) return 'Template title is required'
  if (title.length < 2) return 'Title must be at least 2 characters'
  if (title.length > 80) return 'Title must be at most 80 characters'

  return true
}

function validatePreviewSourceKey(value, formValues) {
  const useInCreateYourLook = Boolean(formValues?.useInCreateYourLook)
  const previewSourceKey = String(value || '').trim()

  if (!useInCreateYourLook) return true

  if (!previewSourceKey) {
    return 'Create Your Look preview requires a prototype-based source'
  }

  return true
}

function validateSlug(value, fullForm) {
  const rawSlug = String(value || '').trim()
  const fallbackTitle = String(fullForm?.title || '').trim()
  const finalSlug = makeSlug(rawSlug || fallbackTitle)

  if (!finalSlug) return 'Slug is required'
  if (finalSlug.length < 2) return 'Slug must be at least 2 characters'
  if (finalSlug.length > 100) return 'Slug must be at most 100 characters'
  if (!/^[a-z0-9-]+$/.test(finalSlug)) {
    return 'Slug can contain only lowercase letters, numbers, and hyphens'
  }

  return true
}

function validateCategory(value, availableCategories = []) {
  const normalized = String(value || '').trim()
  const allowed = availableCategories.map((item) => String(item.value || ''))

  if (!normalized) return 'Category is required'
  if (!allowed.includes(normalized)) return 'Please select a valid category'

  return true
}

function validateTags(value) {
  const tags = normalizeTags(value)

  if (tags.length > 20) return 'Use no more than 20 tags'

  const hasTooLongTag = tags.some((tag) => tag.length > 30)
  if (hasTooLongTag) return 'Each tag must be at most 30 characters'

  return true
}

function validateBasePrompt(value) {
  const prompt = String(value || '').trim()

  if (!prompt) return 'Base prompt is required'
  if (prompt.length < 10) return 'Base prompt must be at least 10 characters'
  if (prompt.length > 5000) return 'Base prompt must be at most 5000 characters'

  return true
}

function validatePreviewFile(file) {
  if (!file) return 'Preview image is required'
  if (!String(file.type || '').startsWith('image/')) {
    return 'Only image files are allowed'
  }

  return true
}

export default function ReadyTemplateForm() {
  const dispatch = useDispatch()

  const categories = useSelector(getReadyTemplateCategories) || []
  const promptCategory = useSelector(getReadyTemplatePromtCategory)
  const suggestedTitle = useSelector(getReadyTemplateSuggestedTitle)
  const suggestedTags = useSelector(getReadyTemplateSuggestedTags)
  const resolveMetadataLoading = useSelector(getReadyTemplateResolveMetadataLoading)

  const [dragActive, setDragActive] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [appliedPreviewSrc, setAppliedPreviewSrc] = useState('')

  const [previewGeneratorResetKey, setPreviewGeneratorResetKey] = useState(0)

  const tCategory = useTranslate('Category', { caseMode: 'sentence' })
  const tCategoryHint = useTranslate('Choose the closest template group.', {
    caseMode: 'sentence',
  })
  const tSelectOption = useTranslate('Select option', { caseMode: 'sentence' })
  const tPreviewAlt = useTranslate('Template preview image', {
    caseMode: 'sentence',
  })

  const categorySelectOptions = useMemo(() => {
    return categories.map((item) => ({
      value: item,
      label: item,
    }))
  }, [categories])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  })

  const watchedTitle = watch('title')
  const watchedSlug = watch('slug')
  const watchedCategory = watch('category')
  const watchedTags = watch('tags')
  const watchedBasePrompt = watch('basePrompt')
  const watchedPreviewFile = watch('previewFile')
  const watchedPublished = watch('isPublished')
  const watchedPreviewSourceKey = watch('previewSourceKey')
  const watchedUseInCreateYourLook = watch('useInCreateYourLook')

  const parsedTags = useMemo(() => normalizeTags(watchedTags), [watchedTags])
  const generatedSlug = useMemo(() => makeSlug(watchedTitle), [watchedTitle])

  useEffect(() => {
    dispatch(getCategories())
  }, [dispatch])

  useEffect(() => {
    if (!watchedCategory && categorySelectOptions.length > 0) {
      setValue('category', categorySelectOptions[0].value, {
        shouldValidate: false,
      })
    }
  }, [watchedCategory, categorySelectOptions, setValue])

  useEffect(() => {
    const resolvedCategory = String(promptCategory || '').trim()

    if (!resolvedCategory) return

    const existsInOptions = categorySelectOptions.some(
      (option) => option.value === resolvedCategory,
    )

    if (!existsInOptions) return

    setValue('category', resolvedCategory, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    clearErrors('category')
  }, [promptCategory, categorySelectOptions, setValue, clearErrors])

  useEffect(() => {
    const resolvedTitle = String(suggestedTitle || '').trim()
    if (!resolvedTitle) return
    setValue('title', resolvedTitle, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    clearErrors('title')
  }, [suggestedTitle, setValue, clearErrors])

  useEffect(() => {
    if (!Array.isArray(suggestedTags) || suggestedTags.length === 0) return
    const resolvedTags = suggestedTags
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join(', ')
    if (!resolvedTags) return
    setValue('tags', resolvedTags, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    clearErrors('tags')
  }, [suggestedTags, setValue, clearErrors])

  useEffect(() => {
    if (!watchedPreviewFile) {
      setPreviewSrc('')
      return
    }
    const objectUrl = URL.createObjectURL(watchedPreviewFile)
    setPreviewSrc(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [watchedPreviewFile])

  const handleFile = async (file) => {
    setValue('previewFile', file || null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    setValue('previewSourceKey', '', {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: true,
    })

    setValue('useInCreateYourLook', false, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    })

    await trigger(['previewFile', 'previewSourceKey'])
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer?.files?.[0] || null
    setAppliedPreviewSrc('')
    await handleFile(file)
  }

  const handleApplyGeneratedPreview = async ({
    previewFile,
    previewUrl,
    previewSourceKey,
    basePrompt,
  }) => {
    const safePrompt = String(basePrompt || '').trim()

    setValue('previewFile', previewFile || null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    setValue('previewSourceKey', previewSourceKey || '', {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: true,
    })

    setValue('basePrompt', safePrompt, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    if (!previewSourceKey) {
      setValue('useInCreateYourLook', false, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      })
    }

    setAppliedPreviewSrc(previewUrl || '')
    await trigger(['previewFile', 'previewSourceKey', 'basePrompt'])

    if (safePrompt.length >= 10) {
      try {
        dispatch(clearResolvePromptMetadata())
        await dispatch(resolvePromptMetadata({ prompt: safePrompt })).unwrap()
      } catch {
        // no-op
      }
    }
  }

  const handleGeneratePreview = async ({
    prompt,
    sourceFile,
    sourceMode,
    prototype,
    output,
    photoQuality,
    aiModel,
    modelPreset,
  }) => {
    const safePrompt = String(prompt || '').trim()

    if (!safePrompt) {
      throw new Error('Generation prompt is required')
    }

    if (!sourceFile) {
      throw new Error('Source photo is required')
    }

    if (!output?.id) {
      throw new Error('Output format is required')
    }

    const formData = new FormData()
    formData.append('prompt', safePrompt)
    formData.append('sourceImage', sourceFile)
    formData.append('sourceMode', sourceMode || 'prototype')
    formData.append('outputId', output.id)

    if (prototype?.gender) {
      formData.append('prototypeGender', prototype.gender)
    }

    if (prototype?.view) {
      formData.append('prototypeView', prototype.view)
    }

    if (prototype?.tone) {
      formData.append('prototypeTone', prototype.tone)
    }

    if (photoQuality?.id) {
      formData.append('photoQualityId', photoQuality.id)
    }

    if (aiModel) {
      formData.append('aiModel', aiModel)
    }

    if (modelPreset) {
      formData.append('modelPreset', modelPreset)
    }

    const data = await dispatch(generateReadyTemplatePreview(formData)).unwrap()

    if (!data?.previewUrl) {
      throw new Error(data?.message || 'Failed to generate preview')
    }

    return {
      previewUrl: data.previewUrl,
      file: data.previewUrl.startsWith('data:')
        ? dataUrlToFile(data.previewUrl, 'generated-preview.png')
        : null,
    }
  }

  const handleReset = () => {
    reset({
      ...DEFAULT_VALUES,
      category: categorySelectOptions[0]?.value || '',
    })
    dispatch(clearResolvePromptMetadata())
    setDragActive(false)
    setPreviewSrc('')
    setAppliedPreviewSrc('')
    setPreviewGeneratorResetKey((prev) => prev + 1)
  }

  const onSubmit = async (values) => {
    try {
      const formData = new FormData()

      formData.append('title', String(values.title || '').trim())
      formData.append('slug', makeSlug(values.slug || values.title))
      formData.append('category', String(values.category || '').trim())
      formData.append('basePrompt', String(values.basePrompt || '').trim())
      formData.append('isPublished', String(Boolean(values.isPublished)))
      formData.append('preview', values.previewFile)
      formData.append('previewSourceKey', String(values.previewSourceKey || ''))
      formData.append(
        'useInCreateYourLook',
        String(Boolean(values.useInCreateYourLook)),
      )

      normalizeTags(values.tags).forEach((tag) => {
        formData.append('tags', tag)
      })

      await dispatch(createReadyTemplate(formData)).unwrap()

      reset({
        ...DEFAULT_VALUES,
        category: categorySelectOptions[0]?.value || '',
      })
      dispatch(clearResolvePromptMetadata())
      setDragActive(false)
      setPreviewSrc('')
      setAppliedPreviewSrc('')
      setPreviewGeneratorResetKey((prev) => prev + 1)
    } catch (error) {
      const message =
        error?.data?.message || error?.message || 'Something went wrong'

      setError('title', {
        type: 'server',
        message,
      })
    }
  }

  const payloadPreview = useMemo(
    () => ({
      title: String(watchedTitle || '').trim(),
      slug: makeSlug(watchedSlug || watchedTitle),
      category: watchedCategory,
      tags: parsedTags,
      previewSourceKey: String(watchedPreviewSourceKey || ''),
      useInCreateYourLook: Boolean(watchedUseInCreateYourLook),
      basePrompt: String(watchedBasePrompt || '').trim(),
      isPublished: Boolean(watchedPublished),
    }),
    [
      watchedTitle,
      watchedSlug,
      watchedCategory,
      parsedTags,
      watchedPreviewSourceKey,
      watchedUseInCreateYourLook,
      watchedBasePrompt,
      watchedPublished,
    ],
  )

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]"
    >
      <section className="gradient-border-card p-4 sm:p-5 md:p-6 lg:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[70%]">
            <Text as="h2" variant="h3" color="white" caseMode="sentence">
              Preview image
            </Text>

            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-2 max-w-2xl"
            >
              Generate a preview then apply the result as the final template
              image.
            </Text>
          </div>

          <Text
            as="span"
            variant="caption"
            color="faint"
            className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1"
          >
            JPG, PNG, WEBP
          </Text>
        </div>

        <TemplatePreviewGenerator
          value={watchedPreviewFile}
          onApply={handleApplyGeneratedPreview}
          onGenerate={handleGeneratePreview}
          disabled={isSubmitting}
          resetSignal={previewGeneratorResetKey}
        />

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-4">
            <Text as="h3" variant="body" color="white" caseMode="sentence">
              Final preview image
            </Text>

            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-2"
            >
              You can still replace the final preview manually by uploading
              another image.
            </Text>
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={[
              'flex min-h-[240px] w-full cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed p-4 text-center transition sm:min-h-[300px] md:min-h-[360px] md:p-6',
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-white/15 bg-background-soft/70 hover:border-primary/60 hover:bg-background-soft',
            ].join(' ')}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0] || null
                setAppliedPreviewSrc('')
                await handleFile(file)
              }}
            />

            {previewSrc || appliedPreviewSrc ? (
              <div className="w-full">
                <div className="overflow-hidden rounded-[22px] border border-white/10 bg-background-soft p-2 md:p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc || appliedPreviewSrc}
                    alt={tPreviewAlt}
                    className="mx-auto max-h-[240px] w-auto rounded-[18px] object-contain sm:max-h-[320px] md:max-h-[520px]"
                  />
                </div>

                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                  className="mx-auto mt-4 max-w-[560px]"
                >
                  Click or drag another image to replace the final preview.
                </Text>
              </div>
            ) : (
              <div className="max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/15 text-2xl text-primary-soft shadow-violet-soft">
                  ⤴
                </div>

                <Text as="h3" variant="h3" color="white" caseMode="sentence">
                  Drop final preview image here
                </Text>

                <Text
                  as="p"
                  variant="body-sm"
                  color="muted"
                  caseMode="sentence"
                  className="mt-3"
                >
                  You can use the generated result above or replace it with your
                  own uploaded preview image.
                </Text>
              </div>
            )}
          </label>

          <input
            type="hidden"
            {...register('previewFile', {
              validate: validatePreviewFile,
            })}
          />

          <input
            type="hidden"
            {...register('previewSourceKey', {
              validate: (value) => validatePreviewSourceKey(value, getValues()),
            })}
          />

          {errors.previewFile?.message ? (
            <div className="mt-2 min-h-5 text-xs leading-5 text-danger">
              {errors.previewFile?.message || '\u00A0'}
            </div>
          ) : null}

          {errors.previewSourceKey?.message ? (
            <div className="mt-2 min-h-5 text-xs leading-5 text-danger">
              {errors.previewSourceKey.message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="gradient-border-card p-4 sm:p-5 md:p-6 lg:p-7">
        <div className="mb-5 max-w-2xl">
          <Text as="h2" variant="h3" color="white" caseMode="sentence">
            Template details
          </Text>

          <Text
            as="p"
            variant="body-sm"
            color="muted"
            caseMode="sentence"
            className="mt-2"
          >
            Define the reusable style metadata and the base prompt for
            generation.
          </Text>
        </div>

        <div className="grid gap-4 md:gap-5">
          <Input
            id="template-title"
            label="Template title"
            type="text"
            placeholder="Avatar Style Portrait"
            hint="2–80 characters."
            required
            caseMode="sentence"
            {...register('title', {
              validate: validateTitle,
            })}
            error={errors.title?.message}
            inputClassName="h-10"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="template-slug"
              label="Slug"
              type="text"
              placeholder={generatedSlug || 'avatar-style-portrait'}
              hint="Leave empty to generate from title."
              caseMode="sentence"
              {...register('slug', {
                validate: (value) => validateSlug(value, getValues()),
              })}
              error={errors.slug?.message}
              inputClassName="h-10"
            />

            <Input
              id="template-tags"
              label="Tags"
              type="text"
              placeholder="avatar, alien, blue, sci-fi, close-up"
              hint="Comma-separated tags."
              caseMode="sentence"
              {...register('tags', {
                validate: validateTags,
              })}
              error={errors.tags?.message}
              inputClassName="h-10"
            />
          </div>

          {parsedTags.length > 0 ? (
            <div className="-mt-1 flex flex-wrap gap-2">
              {parsedTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <Controller
            name="category"
            control={control}
            rules={{
              validate: (value) =>
                validateCategory(value, categorySelectOptions),
            }}
            render={({ field }) => (
              <Select
                id="template-category"
                label={tCategory}
                value={
                  categorySelectOptions.find(
                    (option) => option.value === field.value,
                  ) || null
                }
                onChange={(option) => {
                  field.onChange(option?.value || '')
                  clearErrors('category')
                }}
                options={categorySelectOptions}
                error={errors.category?.message}
                hint={tCategoryHint}
                placeholder={tSelectOption}
                caseMode="sentence"
              />
            )}
          />

          <Input
            id="template-base-prompt"
            as="textarea"
            rows={12}
            label="Base prompt"
            placeholder="Ultra-detailed cinematic close-up portrait..."
            hint="Describe the style and generation intent."
            required
            caseMode="sentence"
            {...register('basePrompt', {
              validate: validateBasePrompt,
            })}
            error={errors.basePrompt?.message}
          />

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background-soft/80 px-4 py-3">
            <input
              type="checkbox"
              {...register('isPublished')}
              className="h-4 w-4 accent-[var(--primary)]"
            />

            <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
              Published in gallery
            </Text>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background-soft/80 px-4 py-3">
            <input
              type="checkbox"
              {...register('useInCreateYourLook')}
              disabled={!watchedPreviewSourceKey}
              className="h-4 w-4 accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
            />

            <div className="flex flex-col">
              <Text
                as="span"
                variant="body-sm"
                color="soft"
                caseMode="sentence"
              >
                Use on Create Your Look page
              </Text>

              <Text
                as="span"
                variant="caption"
                color="muted"
                caseMode="sentence"
              >
                Available only for previews generated from built-in prototype
                photos.
              </Text>
            </div>
          </label>

          <div className="rounded-2xl border border-white/10 bg-background-soft/80 p-4">
            <Text
              as="p"
              variant="caption"
              color="faint"
              caseMode="sentence"
              className="uppercase tracking-[0.2em]"
            >
              Draft payload preview
            </Text>

            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-foreground-soft">
              {JSON.stringify(payloadPreview, null, 2)}
            </pre>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              loading={isSubmitting || resolveMetadataLoading}
              disabled={isSubmitting || resolveMetadataLoading}
              fullWidth
              className="min-h-12 rounded-2xl sm:w-auto"
            >
              Save template draft
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={isSubmitting}
              fullWidth
              className="min-h-12 rounded-2xl sm:w-auto"
            >
              Reset form
            </Button>
          </div>

          <ReadyTemplateAutogeneratePanel />
        </div>
      </section>
    </form>
  )
}
