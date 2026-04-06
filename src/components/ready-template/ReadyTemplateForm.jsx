'use client'

import { useEffect, useMemo, useState } from 'react'
import { createReadyTemplate } from '@/services/api/ready-template'
import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import Text from '@/components/shared/text/Text'
import { useTranslate } from '../../utils/translate/translate'

const initialForm = {
  title: '',
  slug: '',
  category: 'portrait',
  tags: '',
  previewFile: null,
  basePrompt: '',
  isPublished: true,
}

const initialErrors = {
  title: '',
  slug: '',
  category: '',
  tags: '',
  previewFile: '',
  basePrompt: '',
}

const categoryOptions = [
  'portrait',
  'fantasy',
  'anime',
  'cinematic',
  'professional',
  'sci-fi',
  'kids',
  'other',
]

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

function validateField(field, value, fullForm) {
  switch (field) {
    case 'title': {
      const title = String(value || '').trim()
      if (!title) return 'Template title is required.'
      if (title.length < 2) return 'Title must be at least 2 characters.'
      if (title.length > 80) return 'Title must be at most 80 characters.'
      return ''
    }

    case 'slug': {
      const rawSlug = String(value || '').trim()
      const fallbackTitle = fullForm?.title || ''
      const finalSlug = makeSlug(rawSlug || fallbackTitle)

      if (!finalSlug) return 'Slug is required.'
      if (finalSlug.length < 2) return 'Slug must be at least 2 characters.'
      if (finalSlug.length > 100) return 'Slug must be at most 100 characters.'
      if (!/^[a-z0-9-]+$/.test(finalSlug)) {
        return 'Slug can contain only lowercase letters, numbers, and hyphens.'
      }

      return ''
    }

    case 'category': {
      if (!categoryOptions.includes(value))
        return 'Please select a valid category.'
      return ''
    }

    case 'tags': {
      const tags = normalizeTags(value)
      if (tags.length > 20) return 'Use no more than 20 tags.'
      const hasTooLongTag = tags.some((tag) => tag.length > 30)
      if (hasTooLongTag) return 'Each tag must be at most 30 characters.'
      return ''
    }

    case 'basePrompt': {
      const prompt = String(value || '').trim()
      if (!prompt) return 'Base prompt is required.'
      if (prompt.length < 10)
        return 'Base prompt must be at least 10 characters.'
      if (prompt.length > 5000)
        return 'Base prompt must be at most 5000 characters.'
      return ''
    }

    case 'previewFile': {
      if (!value) return 'Preview image is required.'
      if (value && !String(value.type || '').startsWith('image/')) {
        return 'Only image files are allowed.'
      }
      return ''
    }

    default:
      return ''
  }
}

function validateForm(form) {
  return {
    title: validateField('title', form.title, form),
    slug: validateField('slug', form.slug, form),
    category: validateField('category', form.category, form),
    tags: validateField('tags', form.tags, form),
    previewFile: validateField('previewFile', form.previewFile, form),
    basePrompt: validateField('basePrompt', form.basePrompt, form),
  }
}

export default function ReadyTemplateForm() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(initialErrors)
  const [touched, setTouched] = useState({})
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')

  const parsedTags = useMemo(() => normalizeTags(form.tags), [form.tags])
  const generatedSlug = useMemo(() => makeSlug(form.title), [form.title])

  const categorySelectOptions = useMemo(
    () =>
      categoryOptions.map((option) => ({
        value: option,
        label: option,
      })),
    [],
  )

  const tPreviewImage = useTranslate('Preview image')
  const tFormats = useTranslate('JPG, PNG, WEBP')
  const tReplacePreview = useTranslate(
    'Click or drag another image to replace the preview.',
  )
  const tDropPreview = useTranslate('Drop preview image here')
  const tPreviewHint = useTranslate(
    'Use a strong visual example of the final style. This image can later be shown in the template gallery.',
  )

  const tTemplateTitle = useTranslate('Template title')
  const tTemplateTitlePlaceholder = useTranslate('Avatar Style Portrait')
  const tTemplateTitleHint = useTranslate('2–80 characters.')

  const tSlug = useTranslate('Slug')
  const tSlugPlaceholder = useTranslate('avatar-style-portrait')
  const tSlugHint = useTranslate('Leave empty to generate from title.')

  const tCategory = useTranslate('Category')
  const tCategoryHint = useTranslate('Choose the closest template group.')

  const tTags = useTranslate('Tags')
  const tTagsPlaceholder = useTranslate('avatar, alien, blue, sci-fi, close-up')
  const tTagsHint = useTranslate('Comma-separated tags.')

  const tBasePrompt = useTranslate('Base prompt')
  const tBasePromptPlaceholder = useTranslate(
    'Ultra-detailed cinematic close-up portrait...',
  )
  const tBasePromptHint = useTranslate(
    'Describe the style and generation intent.',
  )

  const tPublishedInGallery = useTranslate('Published in gallery')
  const tDraftPayloadPreview = useTranslate('Draft payload preview')
  const tSaveTemplateDraft = useTranslate('Save template draft')
  const tResetForm = useTranslate('Reset form')

  useEffect(() => {
    if (!form.previewFile) {
      setPreviewSrc('')
      return
    }

    const objectUrl = URL.createObjectURL(form.previewFile)
    setPreviewSrc(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [form.previewFile])

  const setFieldError = (field, value, nextForm) => {
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, nextForm),
    }))
  }

  const handleChange = (field) => (e) => {
    const value =
      e?.target?.type === 'checkbox' ? e.target.checked : e.target.value

    setForm((prev) => {
      const nextForm = {
        ...prev,
        [field]: value,
      }

      if (touched[field]) {
        setFieldError(field, value, nextForm)
      }

      if (field === 'title' && touched.slug && !nextForm.slug.trim()) {
        setFieldError('slug', nextForm.slug, nextForm)
      }

      return nextForm
    })
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, form[field], form),
    }))
  }

  const handleFile = (file) => {
    if (!file) return

    setForm((prev) => {
      const nextForm = {
        ...prev,
        previewFile: file,
      }

      setErrors((prevErrors) => ({
        ...prevErrors,
        previewFile: touched.previewFile
          ? validateField('previewFile', file, nextForm)
          : prevErrors.previewFile,
      }))

      return nextForm
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer?.files?.[0]
    handleFile(file)
  }

  const handleReset = () => {
    setForm(initialForm)
    setErrors(initialErrors)
    setTouched({})
    setDragActive(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nextTouched = {
      title: true,
      slug: true,
      category: true,
      tags: true,
      previewFile: true,
      basePrompt: true,
    }

    const nextErrors = validateForm(form)

    setTouched(nextTouched)
    setErrors(nextErrors)

    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) return

    setSubmitting(true)

    try {
      const formData = new FormData()

      formData.append('title', form.title.trim())
      formData.append('slug', makeSlug(form.slug || form.title))
      formData.append('category', form.category)
      formData.append('basePrompt', form.basePrompt.trim())
      formData.append('isPublished', String(form.isPublished))
      formData.append('preview', form.previewFile)

      normalizeTags(form.tags).forEach((tag) => {
        formData.append('tags', tag)
      })

      const { data } = await createReadyTemplate(formData)

      console.log('Created template:', data)
      setForm(initialForm)
      setErrors(initialErrors)
      setTouched({})
      setDragActive(false)
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
    >
      <section className="gradient-border-card p-4 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Text as="h2" variant="h3" color="white">
            {tPreviewImage}
          </Text>

          <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground-muted">
            {tFormats}
          </span>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed p-4 text-center transition md:min-h-[420px] md:p-6 ${
            dragActive
              ? 'border-primary bg-primary/10'
              : 'border-white/15 bg-background-soft/70 hover:border-primary/60 hover:bg-background-soft'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, previewFile: true }))
              handleFile(e.target.files?.[0])
            }}
          />

          {previewSrc ? (
            <div className="w-full">
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-background-soft p-2 md:p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt="Template preview"
                  className="mx-auto max-h-[260px] w-auto rounded-[20px] object-contain md:max-h-[520px]"
                />
              </div>

              <Text as="p" variant="body-sm" color="muted" className="mt-4">
                {tReplacePreview}
              </Text>
            </div>
          ) : (
            <div className="max-w-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/15 text-2xl text-primary-soft shadow-violet-soft">
                ⤴
              </div>

              <Text as="h3" variant="h3" color="white">
                {tDropPreview}
              </Text>

              <Text as="p" variant="body-sm" color="muted" className="mt-3">
                {tPreviewHint}
              </Text>
            </div>
          )}
        </label>

        <div className="mt-3 min-h-5 text-xs leading-5 text-danger">
          {touched.previewFile ? errors.previewFile || '\u00A0' : '\u00A0'}
        </div>
      </section>

      <section className="gradient-border-card p-4 md:p-6">
        <div className="grid gap-4 md:gap-5">
          <Input
            id="template-title"
            label={tTemplateTitle}
            value={form.title}
            onChange={handleChange('title')}
            onBlur={handleBlur('title')}
            placeholder={tTemplateTitlePlaceholder}
            error={touched.title ? errors.title : ''}
            hint={tTemplateTitleHint}
            required
            inputClassName="h-12"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="template-slug"
              label={tSlug}
              value={form.slug}
              onChange={handleChange('slug')}
              onBlur={handleBlur('slug')}
              placeholder={generatedSlug || tSlugPlaceholder}
              error={touched.slug ? errors.slug : ''}
              hint={tSlugHint}
              inputClassName="h-12"
            />

            <Select
              id="template-category"
              label={tCategory}
              value={
                categorySelectOptions.find(
                  (option) => option.value === form.category,
                ) || null
              }
              onChange={(option) => {
                const value = option?.value || ''
                setForm((prev) => {
                  const nextForm = {
                    ...prev,
                    category: value,
                  }

                  if (touched.category) {
                    setErrors((prevErrors) => ({
                      ...prevErrors,
                      category: validateField('category', value, nextForm),
                    }))
                  }

                  return nextForm
                })
              }}
              onBlur={handleBlur('category')}
              options={categorySelectOptions}
              error={touched.category ? errors.category : ''}
              hint={tCategoryHint}
            />
          </div>

          <Input
            id="template-tags"
            label={tTags}
            value={form.tags}
            onChange={handleChange('tags')}
            onBlur={handleBlur('tags')}
            placeholder={tTagsPlaceholder}
            error={touched.tags ? errors.tags : ''}
            hint={tTagsHint}
            inputClassName="h-12"
          />

          {parsedTags.length > 0 && (
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
          )}

          <Input
            id="template-base-prompt"
            as="textarea"
            rows={12}
            label={tBasePrompt}
            value={form.basePrompt}
            onChange={handleChange('basePrompt')}
            onBlur={handleBlur('basePrompt')}
            placeholder={tBasePromptPlaceholder}
            error={touched.basePrompt ? errors.basePrompt : ''}
            hint={tBasePromptHint}
            required
          />

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background-soft/80 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={handleChange('isPublished')}
              className="h-4 w-4 accent-[var(--primary)]"
            />

            <Text as="span" variant="body-sm" color="soft">
              {tPublishedInGallery}
            </Text>
          </label>

          <div className="rounded-2xl border border-white/10 bg-background-soft/80 p-4">
            <Text
              as="p"
              variant="caption"
              color="faint"
              className="uppercase tracking-[0.2em]"
            >
              {tDraftPayloadPreview}
            </Text>

            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-foreground-soft">
              {JSON.stringify(
                {
                  title: form.title.trim(),
                  slug: makeSlug(form.slug || form.title),
                  category: form.category,
                  tags: parsedTags,
                  basePrompt: form.basePrompt.trim(),
                  isPublished: form.isPublished,
                },
                null,
                2,
              )}
            </pre>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={submitting}
              loading={submitting}
              fullWidth
              className="sm:w-auto"
            >
              {tSaveTemplateDraft}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              fullWidth
              className="sm:w-auto"
            >
              {tResetForm}
            </Button>
          </div>
        </div>
      </section>
    </form>
  )
}
