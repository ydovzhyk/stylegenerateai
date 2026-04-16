'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  autogenerateReadyTemplates,
  getCategories,
} from '@/store/ready-template/ready-template-operations'
import {
  getReadyTemplateCategories,
  getReadyTemplateAutoGenerationLoading,
} from '@/store/ready-template/ready-template-selectors'

import Button from '@/components/shared/button/Button'
import Input from '@/components/shared/input/Input'
import Select from '@/components/shared/select/Select'
import Text from '@/components/shared/text/Text'

const DEFAULT_STATE = {
  mode: 'single',
  selectedCategory: '',
  perCategory: 1,
  rangeStart: 1,
  rangeEnd: 1,
  dryRun: true,
}

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return parsed
}

export default function ReadyTemplateAutogeneratePanel() {
  const dispatch = useDispatch()

  const categories = useSelector(getReadyTemplateCategories) || []
  const loading = useSelector(getReadyTemplateAutoGenerationLoading)

  const [mode, setMode] = useState(DEFAULT_STATE.mode)
  const [selectedCategory, setSelectedCategory] = useState(
    DEFAULT_STATE.selectedCategory,
  )
  const [perCategory, setPerCategory] = useState(DEFAULT_STATE.perCategory)
  const [rangeStart, setRangeStart] = useState(DEFAULT_STATE.rangeStart)
  const [rangeEnd, setRangeEnd] = useState(DEFAULT_STATE.rangeEnd)
  const [dryRun, setDryRun] = useState(DEFAULT_STATE.dryRun)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    dispatch(getCategories())
  }, [dispatch])

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0])
    }
  }, [categories, selectedCategory])

  useEffect(() => {
    if (categories.length > 0 && rangeStart === 1 && rangeEnd === 1) {
      setRangeStart(1)
      setRangeEnd(categories.length)
    }
  }, [categories.length, rangeStart, rangeEnd])

  const categoryOptions = useMemo(() => {
    return categories.map((item, index) => ({
      value: item,
      label: `${index + 1}. ${item}`,
    }))
  }, [categories])

  const totalCategories = categories.length

  const selectedStartLabel = categories[toPositiveInt(rangeStart, 1) - 1] || ''
  const selectedEndLabel = categories[toPositiveInt(rangeEnd, 1) - 1] || ''

  const validate = () => {
    const normalizedPerCategory = toPositiveInt(perCategory, 0)

    if (normalizedPerCategory < 1) {
      return 'Templates per category must be at least 1'
    }

    if (mode === 'single') {
      if (!String(selectedCategory || '').trim()) {
        return 'Please select a category'
      }
    }

    if (mode === 'range') {
      const start = toPositiveInt(rangeStart, 0)
      const end = toPositiveInt(rangeEnd, 0)

      if (start < 1 || end < 1) {
        return 'Range values must be positive integers'
      }

      if (start > end) {
        return 'Range start cannot be greater than range end'
      }

      if (end > totalCategories) {
        return `Range end cannot be greater than ${totalCategories}`
      }
    }

    return ''
  }

  const buildPayload = () => {
    const payload = {
      mode,
      perCategory: toPositiveInt(perCategory, 1),
      dryRun: Boolean(dryRun),
    }

    if (mode === 'single') {
      payload.selectedCategory = String(selectedCategory || '').trim()
    }

    if (mode === 'range') {
      payload.rangeStart = toPositiveInt(rangeStart, 1)
      payload.rangeEnd = toPositiveInt(rangeEnd, totalCategories || 1)
    }

    return payload
  }

  const handleSubmit = async () => {
    const validationError = validate()

    if (validationError) {
      setLocalError(validationError)
      return
    }

    try {
      setLocalError('')
      await dispatch(autogenerateReadyTemplates(buildPayload())).unwrap()
    } catch (error) {
      setLocalError(
        error?.data?.message || error?.message || 'Autogeneration failed',
      )
    }
  }

  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
      <div className="mb-4">
        <Text as="h3" variant="body" color="white" caseMode="sentence">
          AI template autogeneration
        </Text>

        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2"
        >
          Generate template drafts for one category or a category range.
        </Text>

        <Text
          as="p"
          variant="body"
          color="white"
          caseMode="sentence"
          className="mt-2"
        >
          Total categories: {totalCategories}
        </Text>
      </div>

      <div className="grid gap-2">
        <Select
          id="autogen-mode"
          label="Generation mode"
          value={
            [
              { value: 'single', label: 'Single category' },
              { value: 'range', label: 'Category range' },
            ].find((option) => option.value === mode) || null
          }
          onChange={(option) => {
            setMode(option?.value || 'single')
            setLocalError('')
          }}
          options={[
            { value: 'single', label: 'Single category' },
            { value: 'range', label: 'Category range' },
          ]}
          placeholder="Select mode"
          caseMode="sentence"
        />

        <Input
          id="autogen-per-category"
          label="Templates per category"
          type="number"
          min="1"
          max="20"
          value={perCategory}
          onChange={(e) => {
            setPerCategory(e.target.value)
            setLocalError('')
          }}
          caseMode="sentence"
          inputClassName="h-10"
        />

        {mode === 'single' ? (
          <Select
            id="autogen-category"
            label="Category"
            value={
              categoryOptions.find(
                (option) => option.value === selectedCategory,
              ) || null
            }
            onChange={(option) => {
              setSelectedCategory(option?.value || '')
              setLocalError('')
            }}
            options={categoryOptions}
            placeholder="Select category"
            caseMode="sentence"
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="autogen-range-start"
                label={`From category index (1-${Math.max(totalCategories, 1)})`}
                type="number"
                min="1"
                max={Math.max(totalCategories, 1)}
                value={rangeStart}
                onChange={(e) => {
                  setRangeStart(e.target.value)
                  setLocalError('')
                }}
                caseMode="sentence"
                inputClassName="h-10"
              />

              <Input
                id="autogen-range-end"
                label={`To category index (1-${Math.max(totalCategories, 1)})`}
                type="number"
                min="1"
                max={Math.max(totalCategories, 1)}
                value={rangeEnd}
                onChange={(e) => {
                  setRangeEnd(e.target.value)
                  setLocalError('')
                }}
                caseMode="sentence"
                inputClassName="h-10"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-background-soft/80 p-4">
              <Text as="p" variant="caption" color="muted" caseMode="sentence">
                Available range: 1–{totalCategories || 0}
              </Text>

              {selectedStartLabel ? (
                <Text
                  as="p"
                  variant="body-sm"
                  color="soft"
                  caseMode="sentence"
                  className="mt-2"
                >
                  From: {selectedStartLabel}
                </Text>
              ) : null}

              {selectedEndLabel ? (
                <Text
                  as="p"
                  variant="body-sm"
                  color="soft"
                  caseMode="sentence"
                  className="mt-1"
                >
                  To: {selectedEndLabel}
                </Text>
              ) : null}
            </div>
          </>
        )}

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background-soft/80 px-4 py-3">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />

          <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
            Dry run
          </Text>
        </label>

        {localError ? (
          <div className="min-h-5 text-xs leading-5 text-danger">
            {localError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row mt-2">
          <Button
            type="button"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
            fullWidth
            className="min-h-12 rounded-2xl sm:w-auto"
          >
            Run autogeneration
          </Button>
        </div>
      </div>
    </div>
  )
}
