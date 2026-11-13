'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@/components/shared/button/Button'
import Checkbox from '@/components/shared/checkbox/Checkbox'
import ConfirmModal from '@/components/shared/confirm-modal/ConfirmModal'
import Pagination from '@/components/shared/pagination/Pagination'
import Text from '@/components/shared/text/Text'
import Select from '@/components/shared/select/Select'

const USAGE_PAGE_SIZE = 20
import {
  axiosDeleteCostRates,
  axiosDeleteCostUsage,
  axiosGetCostBalances,
  axiosGetCostRates,
  axiosGetCostReport,
  axiosPostCostBalance,
  axiosPostCostRate,
} from '@/services/api/cost'

function CompactClearIndicator({ innerProps, isFocused, selectProps }) {
  const isActive = Boolean(isFocused || selectProps?.menuIsOpen)
  if (!isActive) return null

  const { ref, ...restInnerProps } = innerProps || {}

  return (
    <div
      {...restInnerProps}
      ref={ref}
      className="flex cursor-pointer items-center justify-center text-white/45 hover:text-white/75"
      aria-hidden="true"
    >
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none">
        <path
          d="M2 2l6 6M8 2L2 8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'kling', label: 'Kling' },
  { id: 'minimax', label: 'MiniMax' },
]

const EXPORT_SIZE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'print', label: 'Print' },
]

const ALL_OPTION = { value: '__all__', label: 'all' }

function emptyRateForm(provider = 'openai') {
  return {
    provider,
    productKey: 'ready_template',
    modeId: 'ready_template',
    photoQualityId: 'standard',
    model: '',
    avgCostUsd: '',
    sampleCount: '',
    note: '',
  }
}

function inferRateFieldsFromReport(report) {
  const rows = Array.isArray(report?.usage?.rows) ? report.usage.rows : []
  const succeeded = rows.filter(
    (row) => String(row?.status || '').toLowerCase() === 'succeeded',
  )
  const source = succeeded[0] || rows[0] || null
  return {
    productKey: source?.productKey || 'ready_template',
    modeId: source?.modeId || source?.productKey || 'ready_template',
    photoQualityId: source?.photoQualityId || 'standard',
    model: source?.model || '',
    sampleCount:
      report?.usage?.succeededCount != null
        ? String(report.usage.succeededCount)
        : '',
    avgCostUsd:
      report?.estimatedAvgCostUsd != null
        ? String(Number(report.estimatedAvgCostUsd).toFixed(6))
        : '',
  }
}

const PROVIDER_OPTIONS = PROVIDERS.map((item) => ({
  value: item.id,
  label: item.label,
}))

function toDateInputValue(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function startOfDayIso(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toISOString()
}

function endOfDayIso(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T23:59:59.999`).toISOString()
}

function formatUsd(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return `$${Number(value).toFixed(4)}`
}

function formatTokens(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  const numeric = Number(value)
  if (!numeric) return '0'
  return Number.isInteger(numeric)
    ? numeric.toLocaleString()
    : numeric.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function formatActorLabel(actorType, plan) {
  const actor = String(actorType || '').trim().toLowerCase()
  const planKey = String(plan || '').trim().toLowerCase()

  if (actor === 'admin' || planKey === 'admin') return 'Admin'
  if (actor === 'visitor' || actor === 'guest') return 'Guest'
  if (planKey === 'basic' || planKey === 'pro') {
    return `Paid (${planKey})`
  }
  if (actor === 'user') return 'Registered (free)'
  if (!actor && !planKey) return '—'
  return [actor || null, planKey || null].filter(Boolean).join(' · ')
}

function formatExportSizeLabel(photoQualityId) {
  const id = String(photoQualityId || '').trim().toLowerCase()
  if (!id) return '—'
  if (id === 'standard') return 'Standard'
  if (id === 'premium') return 'Premium'
  if (id === 'print') return 'Print'
  if (id === 'draft') return 'Draft'
  return id
}

function formatApiQualityLabel(apiQuality) {
  const value = String(apiQuality || '').trim().toLowerCase()
  if (!value) return '—'
  return value
}

function formatUserCode(row) {
  if (row.userId) return String(row.userId)
  if (row.visitorId) return String(row.visitorId)
  return '—'
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function emptyBalanceInputs() {
  return Object.fromEntries(PROVIDERS.map((item) => [item.id, '0']))
}

/** Latest snapshot per provider (API returns newest first). */
function latestBalancesToInputs(rows = []) {
  const next = emptyBalanceInputs()
  const seen = new Set()
  for (const row of rows) {
    const id = String(row?.provider || '').trim()
    if (!id || !(id in next) || seen.has(id)) continue
    if (row.balanceUsd === null || row.balanceUsd === undefined) continue
    next[id] = String(row.balanceUsd)
    seen.add(id)
  }
  return next
}

function buildFilterOptions(entries, getValue, formatLabel = (v) => v) {
  const unique = new Map()
  for (const entry of entries) {
    const raw = getValue(entry)
    const value = String(raw || '').trim() || '—'
    if (!unique.has(value)) {
      unique.set(value, {
        value,
        label: formatLabel(value === '—' ? '' : value) || value,
      })
    }
  }
  return [
    ALL_OPTION,
    ...Array.from(unique.values()).sort((a, b) =>
      String(a.label).localeCompare(String(b.label)),
    ),
  ]
}

function summarizeUsageEntries(entries = []) {
  let succeededCount = 0
  let failedCount = 0
  let inputTokens = 0
  let outputTokens = 0
  let totalTokens = 0
  let imageTokens = 0
  let withUsageCount = 0

  for (const row of entries) {
    const status = String(row?.status || '').toLowerCase()
    if (status === 'succeeded') succeededCount += 1
    else if (status === 'failed') failedCount += 1

    const input = Number(row?.inputTokens) || 0
    const output = Number(row?.outputTokens) || 0
    const total = Number(row?.totalTokens) || 0
    const image = Number(row?.imageTokens) || 0

    inputTokens += input
    outputTokens += output
    totalTokens += total
    imageTokens += image

    if (total > 0 || input > 0 || output > 0) withUsageCount += 1
  }

  return {
    succeededCount,
    failedCount,
    tokens: {
      inputTokens,
      outputTokens,
      totalTokens,
      imageTokens,
      withUsageCount,
      avgTotalTokens: withUsageCount ? totalTokens / withUsageCount : null,
    },
  }
}

function ColumnFilter({
  id,
  options,
  value,
  onChange,
  placeholder = 'all',
  menuMinWidth,
  mono = false,
}) {
  const hasFilter = Boolean(value)
  const selected = hasFilter
    ? options.find((option) => option.value === value) || null
    : null

  return (
    <Select
      id={id}
      options={options}
      value={selected}
      onChange={(option) =>
        onChange(option?.value === ALL_OPTION.value ? '' : option?.value || '')
      }
      placeholder={placeholder}
      isSearchable
      isClearable={hasFilter}
      hideHelp
      controlMinHeight={32}
      indicatorsCompact
      className="w-full min-w-0"
      menuMinWidth={menuMinWidth}
      components={{ ClearIndicator: CompactClearIndicator }}
      formatOptionLabel={(option) => (
        <span
          className={
            option?.value === ALL_OPTION.value
              ? 'text-[12px] lowercase leading-none text-white/60'
              : mono
                ? 'whitespace-nowrap font-mono text-[12px] leading-none'
                : 'whitespace-nowrap text-[12px] leading-none'
          }
        >
          {option?.label}
        </span>
      )}
      noOptionsMessage={() => 'No matches'}
    />
  )
}

export default function CostReportPanel() {
  const today = useMemo(() => toDateInputValue(new Date()), [])
  const weekAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return toDateInputValue(d)
  }, [])

  const [provider, setProvider] = useState('openai')
  const [fromDate, setFromDate] = useState(weekAgo)
  const [toDate, setToDate] = useState(today)
  const [balanceFromDate, setBalanceFromDate] = useState(today)

  const [balanceInputs, setBalanceInputs] = useState(emptyBalanceInputs)
  const [recordedAt, setRecordedAt] = useState(today)
  const [note, setNote] = useState('')

  const [report, setReport] = useState(null)
  const [balances, setBalances] = useState([])
  const [rates, setRates] = useState([])
  const [rateForm, setRateForm] = useState(() => emptyRateForm('openai'))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingRate, setSavingRate] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingRateId, setDeletingRateId] = useState('')
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [rateMessage, setRateMessage] = useState('')

  const [filters, setFilters] = useState({
    when: '',
    modeId: '',
    model: '',
    userCode: '',
    photoQualityId: '',
    apiQuality: '',
    status: '',
  })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [usagePage, setUsagePage] = useState(1)

  const loadLatestBalancesIntoForm = useCallback(async () => {
    try {
      const data = await axiosGetCostBalances({ limit: 50 })
      setBalanceInputs(latestBalancesToInputs(data?.balances || []))
    } catch {
      // keep zeros if latest balances cannot load
    }
  }, [])

  const loadRates = useCallback(async () => {
    try {
      const data = await axiosGetCostRates()
      setRates(Array.isArray(data?.rates) ? data.rates : [])
    } catch {
      // keep existing rates if refresh fails
    }
  }, [])

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const usageParams = {
        provider,
        from: startOfDayIso(fromDate) || undefined,
        to: endOfDayIso(toDate) || undefined,
      }
      const balanceParams = {
        provider,
        from: startOfDayIso(balanceFromDate) || undefined,
        to: endOfDayIso(toDate) || undefined,
      }
      const [reportData, balanceData] = await Promise.all([
        axiosGetCostReport({
          ...usageParams,
          balanceFrom: balanceParams.from,
        }),
        axiosGetCostBalances({ ...balanceParams, limit: 20 }),
      ])
      setReport(reportData)
      setBalances(balanceData?.balances || [])
      setSelectedIds(new Set())
      setUsagePage(1)
    } catch (err) {
      setError(String(err?.message || 'Failed to load cost report'))
    } finally {
      setLoading(false)
    }
  }, [provider, fromDate, toDate, balanceFromDate])

  useEffect(() => {
    loadLatestBalancesIntoForm()
  }, [loadLatestBalancesIntoForm])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  useEffect(() => {
    setRateForm((prev) => ({ ...prev, provider }))
  }, [provider])

  const handleBalanceChange = (providerId, value) => {
    setBalanceInputs((prev) => ({ ...prev, [providerId]: value }))
  }

  const handleSaveBalance = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setSaveMessage('')
    setError('')
    try {
      const balancesPayload = PROVIDERS.map((item) => ({
        provider: item.id,
        balanceUsd: balanceInputs[item.id],
      })).filter((item) => String(item.balanceUsd || '').trim() !== '')

      if (!balancesPayload.length) {
        setError('Enter at least one provider balance')
        return
      }

      const result = await axiosPostCostBalance({
        balances: balancesPayload.map((item) => ({
          provider: item.provider,
          balanceUsd: Number(item.balanceUsd),
        })),
        recordedAt: startOfDayIso(recordedAt) || new Date().toISOString(),
        note,
      })
      const savedCount = Array.isArray(result?.balances)
        ? result.balances.length
        : balancesPayload.length
      setSaveMessage(
        `Saved ${savedCount} balance snapshot${savedCount === 1 ? '' : 's'}`,
      )
      setNote('')
      await Promise.all([loadReport(), loadLatestBalancesIntoForm()])
    } catch (err) {
      setError(String(err?.message || 'Failed to save balance'))
    } finally {
      setSaving(false)
    }
  }

  const handleRateFieldChange = (key, value) => {
    setRateForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleFillRateFromReport = () => {
    if (report?.estimatedAvgCostUsd == null) return
    const inferred = inferRateFieldsFromReport(report)
    setRateForm((prev) => ({
      ...prev,
      provider,
      ...inferred,
    }))
    setRateMessage('Filled from current report avg')
  }

  const handleSaveRate = async (event) => {
    event.preventDefault()
    if (savingRate) return
    setSavingRate(true)
    setRateMessage('')
    setError('')
    try {
      const avgCostUsd = Number(rateForm.avgCostUsd)
      if (!Number.isFinite(avgCostUsd) || avgCostUsd < 0) {
        setError('Enter a valid avg cost ($)')
        return
      }
      if (!String(rateForm.productKey || '').trim()) {
        setError('Product key is required')
        return
      }

      await axiosPostCostRate({
        provider: rateForm.provider || provider,
        productKey: rateForm.productKey.trim(),
        modeId: String(rateForm.modeId || '').trim(),
        photoQualityId: rateForm.photoQualityId || 'standard',
        model: String(rateForm.model || '').trim(),
        avgCostUsd,
        sampleCount:
          String(rateForm.sampleCount || '').trim() === ''
            ? undefined
            : Number(rateForm.sampleCount),
        measuredFrom: startOfDayIso(fromDate) || undefined,
        measuredTo: endOfDayIso(toDate) || undefined,
        recordedAt: new Date().toISOString(),
        note: rateForm.note,
      })
      setRateMessage('Saved generation cost rate')
      setRateForm((prev) => ({
        ...prev,
        avgCostUsd: '',
        sampleCount: '',
        note: '',
      }))
      await loadRates()
    } catch (err) {
      setError(String(err?.message || 'Failed to save generation cost rate'))
    } finally {
      setSavingRate(false)
    }
  }

  const handleDeleteRate = async (id) => {
    if (!id || deletingRateId) return
    setDeletingRateId(id)
    setError('')
    setRateMessage('')
    try {
      await axiosDeleteCostRates([id])
      setRateMessage('Deleted rate')
      await loadRates()
    } catch (err) {
      setError(String(err?.message || 'Failed to delete rate'))
    } finally {
      setDeletingRateId('')
    }
  }

  const usage = report?.usage
  const entries = usage?.entries || []
  const tokens = usage?.tokens

  const enrichedEntries = useMemo(
    () =>
      entries.map((row) => ({
        ...row,
        whenLabel: formatDateTime(row.createdAt),
        userCode: formatUserCode(row),
        actorLabel: formatActorLabel(row.actorType, row.plan),
        exportSizeLabel: formatExportSizeLabel(row.photoQualityId),
        apiQualityLabel: formatApiQualityLabel(row.apiQuality),
      })),
    [entries],
  )

  const filterOptions = useMemo(
    () => ({
      when: buildFilterOptions(enrichedEntries, (row) => row.whenLabel),
      modeId: buildFilterOptions(enrichedEntries, (row) => row.modeId || '—'),
      model: buildFilterOptions(enrichedEntries, (row) => row.model || '—'),
      userCode: buildFilterOptions(enrichedEntries, (row) => row.userCode),
      photoQualityId: buildFilterOptions(
        enrichedEntries,
        (row) => row.photoQualityId || '—',
        (value) => formatExportSizeLabel(value === '—' ? '' : value),
      ),
      apiQuality: buildFilterOptions(
        enrichedEntries,
        (row) => row.apiQuality || '—',
        (value) => formatApiQualityLabel(value === '—' ? '' : value),
      ),
      status: buildFilterOptions(enrichedEntries, (row) => row.status || '—'),
    }),
    [enrichedEntries],
  )

  const filteredEntries = useMemo(() => {
    return enrichedEntries.filter((row) => {
      if (filters.when && row.whenLabel !== filters.when) return false
      if (filters.modeId) {
        const modeValue = row.modeId || '—'
        if (modeValue !== filters.modeId) return false
      }
      if (filters.model) {
        const modelValue = row.model || '—'
        if (modelValue !== filters.model) return false
      }
      if (filters.userCode && row.userCode !== filters.userCode) return false
      if (filters.photoQualityId) {
        const qualityValue = row.photoQualityId || '—'
        if (qualityValue !== filters.photoQualityId) return false
      }
      if (filters.apiQuality) {
        const apiValue = row.apiQuality || '—'
        if (apiValue !== filters.apiQuality) return false
      }
      if (filters.status) {
        const statusValue = row.status || '—'
        if (statusValue !== filters.status) return false
      }
      return true
    })
  }, [enrichedEntries, filters])

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean),
    [filters],
  )

  const filteredSummary = useMemo(
    () => summarizeUsageEntries(filteredEntries),
    [filteredEntries],
  )

  const summaryCounts = hasActiveFilters
    ? filteredSummary
    : {
        succeededCount: usage?.succeededCount,
        failedCount: usage?.failedCount,
      }

  const summaryTokens = hasActiveFilters ? filteredSummary.tokens : tokens

  const usageTotalPages = Math.max(
    1,
    Math.ceil(filteredEntries.length / USAGE_PAGE_SIZE),
  )

  const safeUsagePage = Math.min(usagePage, usageTotalPages)

  const pagedEntries = useMemo(() => {
    const start = (safeUsagePage - 1) * USAGE_PAGE_SIZE
    return filteredEntries.slice(start, start + USAGE_PAGE_SIZE)
  }, [filteredEntries, safeUsagePage])

  const visibleIds = useMemo(
    () => pagedEntries.map((row) => row.id),
    [pagedEntries],
  )

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))

  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected

  const selectedCount = selectedIds.size

  useEffect(() => {
    if (usagePage > usageTotalPages) {
      setUsagePage(usageTotalPages)
    }
  }, [usagePage, usageTotalPages])

  const setFilterValue = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setSelectedIds(new Set())
    setUsagePage(1)
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.delete(id))
        return next
      }
      const next = new Set(prev)
      visibleIds.forEach((id) => next.add(id))
      return next
    })
  }

  const openDeleteConfirm = () => {
    if (!selectedCount || deleting) return
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    if (deleting) return
    setDeleteConfirmOpen(false)
  }

  const handleConfirmDeleteSelected = async () => {
    if (!selectedCount || deleting) return

    setDeleting(true)
    setError('')
    try {
      await axiosDeleteCostUsage(Array.from(selectedIds))
      setSelectedIds(new Set())
      setDeleteConfirmOpen(false)
      await loadReport()
    } catch (err) {
      setError(String(err?.message || 'Failed to delete usage logs'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <div className="space-y-0.5">
            <Text as="h2" variant="h3" color="white" caseMode="sentence">
              Provider balances
            </Text>
            <Text as="p" variant="caption" color="muted" caseMode="sentence">
              Fields load the latest saved balances from the server. Edit and
              save a new snapshot for today.
            </Text>
          </div>

          <form onSubmit={handleSaveBalance} className="space-y-2.5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PROVIDERS.map((item) => (
                <label key={item.id} className="block space-y-1">
                  <Text
                    as="span"
                    variant="caption"
                    color="soft"
                    caseMode="sentence"
                  >
                    {item.label}
                  </Text>
                  <input
                    type="number"
                    step="0.0001"
                    value={balanceInputs[item.id]}
                    onChange={(e) =>
                      handleBalanceChange(item.id, e.target.value)
                    }
                    className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                    placeholder="13.62"
                  />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Recorded date
                </Text>
                <input
                  type="date"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                />
              </label>
              <label className="block space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Note
                </Text>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                  placeholder="optional"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={saving}
                className="w-[8.25rem] shrink-0"
              >
                {saving ? 'Saving…' : 'Save balances'}
              </Button>
              {saveMessage ? (
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  {saveMessage}
                </Text>
              ) : null}
            </div>
          </form>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <div className="space-y-0.5">
            <Text as="h2" variant="h3" color="white" caseMode="sentence">
              Generation cost rates
            </Text>
            <Text as="p" variant="caption" color="muted" caseMode="sentence">
              Saved avg $/gen by provider × product × mode × export size. Use
              for credit math later. Upserts the same key.
            </Text>
          </div>

          <form onSubmit={handleSaveRate} className="space-y-2.5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Provider
                </Text>
                <Select
                  id="cost-rate-provider"
                  options={PROVIDER_OPTIONS}
                  value={
                    PROVIDER_OPTIONS.find(
                      (item) => item.value === rateForm.provider,
                    ) || PROVIDER_OPTIONS[0]
                  }
                  onChange={(option) =>
                    handleRateFieldChange(
                      'provider',
                      option?.value || 'openai',
                    )
                  }
                  hideHelp
                  controlMinHeight={36}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Export size
                </Text>
                <Select
                  id="cost-rate-export"
                  options={EXPORT_SIZE_OPTIONS}
                  value={
                    EXPORT_SIZE_OPTIONS.find(
                      (item) => item.value === rateForm.photoQualityId,
                    ) || EXPORT_SIZE_OPTIONS[0]
                  }
                  onChange={(option) =>
                    handleRateFieldChange(
                      'photoQualityId',
                      option?.value || 'standard',
                    )
                  }
                  hideHelp
                  controlMinHeight={36}
                  className="w-full"
                />
              </div>
              <label className="block space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Product
                </Text>
                <input
                  type="text"
                  value={rateForm.productKey}
                  onChange={(e) =>
                    handleRateFieldChange('productKey', e.target.value)
                  }
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                  placeholder="ready_template"
                />
              </label>
              <label className="block space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Mode
                </Text>
                <input
                  type="text"
                  value={rateForm.modeId}
                  onChange={(e) =>
                    handleRateFieldChange('modeId', e.target.value)
                  }
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                  placeholder="ready_template"
                />
              </label>
              <label className="block space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Avg cost ($)
                </Text>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={rateForm.avgCostUsd}
                  onChange={(e) =>
                    handleRateFieldChange('avgCostUsd', e.target.value)
                  }
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                  placeholder="0.055"
                />
              </label>
              <label className="block space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Sample count
                </Text>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={rateForm.sampleCount}
                  onChange={(e) =>
                    handleRateFieldChange('sampleCount', e.target.value)
                  }
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                  placeholder="20"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Model (optional)
                </Text>
                <input
                  type="text"
                  value={rateForm.model}
                  onChange={(e) =>
                    handleRateFieldChange('model', e.target.value)
                  }
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                  placeholder="gemini-nano-banana-2.1"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  Note
                </Text>
                <input
                  type="text"
                  value={rateForm.note}
                  onChange={(e) =>
                    handleRateFieldChange('note', e.target.value)
                  }
                  className="box-border h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white"
                  placeholder="Gemini Standard CYL baseline"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleFillRateFromReport}
                disabled={report?.estimatedAvgCostUsd == null}
                className="w-[9.5rem] shrink-0"
              >
                Use report avg
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={savingRate}
                className="w-[7.5rem] shrink-0"
              >
                {savingRate ? 'Saving…' : 'Save rate'}
              </Button>
              {rateMessage ? (
                <Text
                  as="span"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                >
                  {rateMessage}
                </Text>
              ) : null}
            </div>
          </form>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm text-white/90">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/55">
                <tr>
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Avg $</th>
                  <th className="px-3 py-2 font-medium">n</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-3 text-sm text-white/50"
                    >
                      No saved rates yet.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="border-t border-white/8">
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white/90">
                            {rate.provider} · {rate.productKey}
                            {rate.modeId ? ` · ${rate.modeId}` : ''} ·{' '}
                            {formatExportSizeLabel(rate.photoQualityId)}
                          </span>
                          {rate.model ? (
                            <span className="font-mono text-[11px] text-white/45">
                              {rate.model}
                            </span>
                          ) : null}
                          {rate.note ? (
                            <span className="text-[11px] text-white/40">
                              {rate.note}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-white/85">
                        {formatUsd(rate.avgCostUsd)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-white/70">
                        {rate.sampleCount ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRate(rate.id)}
                          disabled={deletingRateId === rate.id}
                          className="text-xs text-white/45 hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingRateId === rate.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Text as="h2" variant="h3" color="white" caseMode="sentence">
              Generations
            </Text>
            <Text as="p" variant="caption" color="muted" caseMode="sentence">
              Individual usage logs. Filter by column (searchable) or delete
              selected rows.
            </Text>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[10rem] shrink-0">
              <Select
                id="cost-report-provider"
                label="Provider"
                labelClassName="!mb-1 text-xs text-white/70"
                options={PROVIDER_OPTIONS}
                value={
                  PROVIDER_OPTIONS.find((item) => item.value === provider) ||
                  PROVIDER_OPTIONS[0]
                }
                onChange={(option) => setProvider(option?.value || 'openai')}
                hideHelp
                controlMinHeight={36}
                className="w-full"
              />
            </div>
            <label className="block w-[9.75rem] shrink-0 space-y-1">
              <Text as="span" variant="caption" color="soft">
                From
              </Text>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="box-border block h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition-[border-color,box-shadow] focus:border-[rgba(124,92,255,0.9)] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
              />
            </label>
            <label className="block w-[9.75rem] shrink-0 space-y-1">
              <Text as="span" variant="caption" color="soft">
                To
              </Text>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="box-border block h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition-[border-color,box-shadow] focus:border-[rgba(124,92,255,0.9)] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
              />
            </label>
            <label className="block w-[9.75rem] shrink-0 space-y-1">
              <Text as="span" variant="caption" color="soft">
                Balance from
              </Text>
              <input
                type="date"
                value={balanceFromDate}
                onChange={(e) => setBalanceFromDate(e.target.value)}
                className="box-border block h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition-[border-color,box-shadow] focus:border-[rgba(124,92,255,0.9)] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadReport}
              disabled={loading}
              className="w-[6.5rem] shrink-0"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openDeleteConfirm}
              disabled={!selectedCount || deleting}
              className="w-[11.5rem] shrink-0"
            >
              {deleting
                ? 'Deleting…'
                : selectedCount
                  ? `Delete selected (${selectedCount})`
                  : 'Delete selected'}
            </Button>
          </div>
        </div>

        {error ? (
          <Text
            as="p"
            variant="caption"
            color="soft"
            caseMode="sentence"
            className="text-red-300"
          >
            {error}
          </Text>
        ) : null}

        {report?.warning ? (
          <Text
            as="p"
            variant="caption"
            color="soft"
            caseMode="sentence"
            className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2"
          >
            {report.warning}
          </Text>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Succeeded"
            value={summaryCounts.succeededCount ?? '—'}
          />
          <Stat label="Failed" value={summaryCounts.failedCount ?? '—'} />
          <Stat
            label="Δ balance"
            value={formatUsd(report?.balanceDeltaUsd)}
          />
          <Stat
            label="Est. avg / success"
            value={
              hasActiveFilters
                ? '—'
                : formatUsd(report?.estimatedAvgCostUsd)
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Input tokens"
            value={formatTokens(summaryTokens?.inputTokens)}
          />
          <Stat
            label="Output tokens"
            value={formatTokens(summaryTokens?.outputTokens)}
          />
          <Stat
            label="Image tokens"
            value={formatTokens(summaryTokens?.imageTokens)}
          />
          <Stat
            label="Avg total / gen"
            value={formatTokens(summaryTokens?.avgTotalTokens)}
          />
        </div>

        <div className="w-full overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[78rem] table-fixed text-left text-sm text-white/90">
            <thead className="bg-white/[0.04] text-xs tracking-wide text-white/55">
              <tr>
                <th className="w-10 px-3 py-2 font-medium">
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all visible rows"
                  />
                </th>
                <th className="w-[9.5rem] px-3 py-2 font-medium uppercase">
                  When
                </th>
                <th className="w-[10.5rem] px-3 py-2 font-medium uppercase">
                  Mode
                </th>
                <th className="w-[13rem] px-3 py-2 font-medium uppercase">
                  Model
                </th>
                <th className="w-[14rem] px-3 py-2 font-medium uppercase">
                  User
                </th>
                <th className="w-[7rem] px-3 py-2 font-medium uppercase">
                  Export size
                </th>
                <th className="w-[6.5rem] px-3 py-2 font-medium uppercase">
                  API quality
                </th>
                <th className="w-[6rem] px-3 py-2 font-medium uppercase">
                  Status
                </th>
                <th className="w-[4.5rem] px-3 py-2 font-medium uppercase">
                  In
                </th>
                <th className="w-[4.5rem] px-3 py-2 font-medium uppercase">
                  Out
                </th>
                <th className="w-[4.5rem] px-3 py-2 font-medium uppercase">
                  Img
                </th>
              </tr>
              <tr className="border-t border-white/8 normal-case">
                <th className="px-3 py-2" />
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="cost-filter-when"
                    options={filterOptions.when}
                    value={filters.when}
                    onChange={(value) => setFilterValue('when', value)}
                    placeholder="When"
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="cost-filter-mode"
                    options={filterOptions.modeId}
                    value={filters.modeId}
                    onChange={(value) => setFilterValue('modeId', value)}
                    placeholder="Mode"
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="cost-filter-model"
                    options={filterOptions.model}
                    value={filters.model}
                    onChange={(value) => setFilterValue('model', value)}
                    placeholder="Model"
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="cost-filter-user"
                    options={filterOptions.userCode}
                    value={filters.userCode}
                    onChange={(value) => setFilterValue('userCode', value)}
                    placeholder="User id"
                    menuMinWidth="16rem"
                    mono
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="cost-filter-export"
                    options={filterOptions.photoQualityId}
                    value={filters.photoQualityId}
                    onChange={(value) =>
                      setFilterValue('photoQualityId', value)
                    }
                    placeholder="Export"
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="cost-filter-api-quality"
                    options={filterOptions.apiQuality}
                    value={filters.apiQuality}
                    onChange={(value) => setFilterValue('apiQuality', value)}
                    placeholder="API quality"
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="cost-filter-status"
                    options={filterOptions.status}
                    value={filters.status}
                    onChange={(value) => setFilterValue('status', value)}
                    placeholder="Status"
                  />
                </th>
                <th className="px-3 py-2" />
                <th className="px-3 py-2" />
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {pagedEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-3 py-4 text-sm text-white/50"
                  >
                    No generations in this window.
                  </td>
                </tr>
              ) : (
                pagedEntries.map((row) => (
                  <tr key={row.id} className="border-t border-white/8">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                    <td className="truncate px-3 py-2 whitespace-nowrap text-white/80">
                      {row.whenLabel}
                    </td>
                    <td
                      className="truncate px-3 py-2"
                      title={row.modeId || '—'}
                    >
                      {row.modeId || '—'}
                    </td>
                    <td
                      className="truncate px-3 py-2"
                      title={row.model || '—'}
                    >
                      {row.model || '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="truncate font-mono text-xs text-white/85"
                          title={row.userCode}
                        >
                          {row.userCode}
                        </span>
                        <span className="text-xs text-white/45">
                          {row.actorLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-white/80">
                      {row.exportSizeLabel}
                    </td>
                    <td className="px-3 py-2 text-white/70">
                      {row.apiQualityLabel}
                    </td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">
                      {formatTokens(row.inputTokens)}
                    </td>
                    <td className="px-3 py-2">
                      {formatTokens(row.outputTokens)}
                    </td>
                    <td className="px-3 py-2">
                      {formatTokens(row.imageTokens)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text as="p" variant="caption" color="muted" caseMode="sentence">
            Showing {pagedEntries.length} on page {safeUsagePage} of{' '}
            {filteredEntries.length} filtered
            {enrichedEntries.length !== filteredEntries.length
              ? ` (${enrichedEntries.length} loaded)`
              : ''}
            {usage?.entryLimit ? ` · load cap ${usage.entryLimit}` : ''}.
          </Text>
          <Pagination
            page={safeUsagePage}
            totalPages={usageTotalPages}
            onChange={setUsagePage}
          />
        </div>

        <div>
          <Text
            as="h3"
            variant="body"
            color="white"
            caseMode="sentence"
            className="mb-2 font-semibold"
          >
            Recent balances ({provider})
          </Text>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm text-white/90">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/55">
                <tr>
                  <th className="px-3 py-2 font-medium">Recorded</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {balances.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-4 text-sm text-white/50"
                    >
                      No balance snapshots yet.
                    </td>
                  </tr>
                ) : (
                  balances.map((row) => (
                    <tr key={row.id} className="border-t border-white/8">
                      <td className="px-3 py-2">
                        {formatDateTime(row.recordedAt)}
                      </td>
                      <td className="px-3 py-2">
                        {formatUsd(row.balanceUsd)}
                      </td>
                      <td className="px-3 py-2 text-white/70">
                        {row.note || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={deleteConfirmOpen}
        elevated
        title={
          selectedCount === 1
            ? 'Delete usage log?'
            : 'Delete usage logs?'
        }
        description="This removes the selected generation cost logs from the report."
        detail={
          selectedCount === 1
            ? '1 selected log'
            : `${selectedCount} selected logs`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteSelected}
        onCancel={closeDeleteConfirm}
        confirmLoading={deleting}
        closeAriaLabel="Close delete confirmation"
      />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <Text as="p" variant="caption" color="muted" caseMode="sentence">
        {label}
      </Text>
      <Text
        as="p"
        variant="body"
        color="white"
        className="mt-0.5 text-lg font-semibold"
      >
        {value}
      </Text>
    </div>
  )
}
