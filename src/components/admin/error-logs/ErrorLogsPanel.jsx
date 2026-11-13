'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@/components/shared/button/Button'
import Checkbox from '@/components/shared/checkbox/Checkbox'
import ConfirmModal from '@/components/shared/confirm-modal/ConfirmModal'
import Pagination from '@/components/shared/pagination/Pagination'
import Text from '@/components/shared/text/Text'
import Select from '@/components/shared/select/Select'
import {
  axiosDeleteErrorLogs,
  axiosGetErrorLogs,
} from '@/services/api/error-logs'

const PAGE_SIZE = 20
const ALL_OPTION = { value: '__all__', label: 'all' }
const SIDES = [
  { id: 'server', label: 'Server' },
  { id: 'frontend', label: 'Frontend' },
]

const DATE_INPUT_CLASS =
  'box-border block h-9 w-full rounded-2xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition-[border-color,box-shadow] focus:border-[rgba(124,92,255,0.9)] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]'

const COLUMN_SEARCH_CLASS =
  'box-border block h-8 w-full min-w-0 rounded-xl border border-white/12 bg-black/30 px-2 text-[12px] text-white outline-none transition-[border-color,box-shadow] focus:border-[rgba(124,92,255,0.9)] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]'

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

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function buildSelectOptions(values = [], formatLabel = (v) => String(v)) {
  return [
    ALL_OPTION,
    ...values.map((value) => ({
      value: String(value),
      label: formatLabel(value) || String(value),
    })),
  ]
}

function emptyFilters() {
  return {
    area: '',
    productKey: '',
    source: '',
    method: '',
    code: '',
    status: '',
    q: '',
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

export default function ErrorLogsPanel() {
  const today = useMemo(() => toDateInputValue(new Date()), [])
  const weekAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return toDateInputValue(d)
  }, [])

  const [side, setSide] = useState('server')
  const [fromDate, setFromDate] = useState(weekAgo)
  const [toDate, setToDate] = useState(today)

  const [filters, setFilters] = useState(emptyFilters)
  const [searchDraft, setSearchDraft] = useState('')

  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState([])
  const [facets, setFacets] = useState({})
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [expandedId, setExpandedId] = useState('')

  const setFilterValue = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
    setSelectedIds(new Set())
  }

  const resetSideFilters = () => {
    setFilters(emptyFilters())
    setSearchDraft('')
    setPage(1)
    setSelectedIds(new Set())
    setExpandedId('')
  }

  const loadErrors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await axiosGetErrorLogs({
        side,
        from: startOfDayIso(fromDate) || undefined,
        to: endOfDayIso(toDate) || undefined,
        area: side === 'server' ? filters.area || undefined : undefined,
        productKey:
          side === 'server' ? filters.productKey || undefined : undefined,
        source: side === 'frontend' ? filters.source || undefined : undefined,
        method: side === 'frontend' ? filters.method || undefined : undefined,
        code: filters.code || undefined,
        status: filters.status || undefined,
        q: filters.q || undefined,
        page,
        limit: PAGE_SIZE,
      })
      setEntries(Array.isArray(data?.entries) ? data.entries : [])
      setFacets(data?.facets && typeof data.facets === 'object' ? data.facets : {})
      setTotal(Number(data?.total) || 0)
      setTotalPages(Math.max(1, Number(data?.totalPages) || 1))
      setSelectedIds(new Set())
      setExpandedId('')
    } catch (err) {
      setError(String(err?.message || 'Failed to load error logs'))
    } finally {
      setLoading(false)
    }
  }, [side, fromDate, toDate, filters, page])

  useEffect(() => {
    loadErrors()
  }, [loadErrors])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const areaOptions = useMemo(
    () => buildSelectOptions(facets.areas || []),
    [facets.areas],
  )
  const productOptions = useMemo(
    () => buildSelectOptions(facets.productKeys || []),
    [facets.productKeys],
  )
  const sourceOptions = useMemo(
    () => buildSelectOptions(facets.sources || []),
    [facets.sources],
  )
  const methodOptions = useMemo(
    () => buildSelectOptions(facets.methods || []),
    [facets.methods],
  )
  const codeOptions = useMemo(
    () => buildSelectOptions(facets.codes || []),
    [facets.codes],
  )
  const statusOptions = useMemo(
    () => buildSelectOptions(facets.statuses || []),
    [facets.statuses],
  )

  const enrichedEntries = useMemo(
    () =>
      entries.map((row) => ({
        ...row,
        whenLabel: formatDateTime(row.createdAt),
        statusLabel:
          row.status === null || row.status === undefined
            ? '—'
            : String(row.status),
      })),
    [entries],
  )

  const visibleIds = useMemo(
    () => enrichedEntries.map((row) => row.id),
    [enrichedEntries],
  )

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))

  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected

  const selectedCount = selectedIds.size
  const colSpan = 9

  const applySearch = () => {
    setFilterValue('q', searchDraft.trim())
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

  const handleConfirmDelete = async () => {
    if (!selectedCount || deleting) return
    setDeleting(true)
    setError('')
    try {
      await axiosDeleteErrorLogs({
        side,
        ids: Array.from(selectedIds),
      })
      setSelectedIds(new Set())
      setDeleteConfirmOpen(false)
      await loadErrors()
    } catch (err) {
      setError(String(err?.message || 'Failed to delete error logs'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Text as="h2" variant="h3" color="white" caseMode="sentence">
              Error logs
            </Text>
            <Text as="p" variant="caption" color="muted" caseMode="sentence">
              App-wide server and frontend errors. Filter by column or delete
              selected rows. {total} match{total === 1 ? '' : 'es'} in range.
            </Text>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex h-9 shrink-0 overflow-hidden rounded-2xl border border-white/12">
              {SIDES.map((item) => {
                const active = side === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (side === item.id) return
                      setSide(item.id)
                      resetSideFilters()
                    }}
                    className={`px-3 text-sm transition-colors ${
                      active
                        ? 'bg-white/12 text-white'
                        : 'bg-transparent text-white/55 hover:text-white/80'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>

            <label className="block w-[9.75rem] shrink-0 space-y-1">
              <Text as="span" variant="caption" color="soft">
                From
              </Text>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(1)
                }}
                className={DATE_INPUT_CLASS}
              />
            </label>
            <label className="block w-[9.75rem] shrink-0 space-y-1">
              <Text as="span" variant="caption" color="soft">
                To
              </Text>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(1)
                }}
                className={DATE_INPUT_CLASS}
              />
            </label>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadErrors}
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

        <div className="w-full overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[72rem] table-fixed text-left text-sm text-white/90">
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
                {side === 'server' ? (
                  <>
                    <th className="w-[14rem] px-3 py-2 font-medium uppercase">
                      Area
                    </th>
                    <th className="w-[8rem] px-3 py-2 font-medium uppercase">
                      Product
                    </th>
                    <th className="w-[7rem] px-3 py-2 font-medium uppercase">
                      Job
                    </th>
                  </>
                ) : (
                  <>
                    <th className="w-[7rem] px-3 py-2 font-medium uppercase">
                      Source
                    </th>
                    <th className="w-[5.5rem] px-3 py-2 font-medium uppercase">
                      Method
                    </th>
                    <th className="w-[16rem] px-3 py-2 font-medium uppercase">
                      Path / page
                    </th>
                  </>
                )}
                <th className="w-[5rem] px-3 py-2 font-medium uppercase">
                  Status
                </th>
                <th className="w-[8rem] px-3 py-2 font-medium uppercase">
                  Code
                </th>
                <th className="px-3 py-2 font-medium uppercase">Message</th>
              </tr>
              <tr className="border-t border-white/8 normal-case">
                <th className="px-3 py-2" />
                <th className="px-3 py-2" />
                {side === 'server' ? (
                  <>
                    <th className="px-2 py-2">
                      <ColumnFilter
                        id="error-filter-area"
                        options={areaOptions}
                        value={filters.area}
                        onChange={(value) => setFilterValue('area', value)}
                        placeholder="Area"
                        menuMinWidth="18rem"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <ColumnFilter
                        id="error-filter-product"
                        options={productOptions}
                        value={filters.productKey}
                        onChange={(value) =>
                          setFilterValue('productKey', value)
                        }
                        placeholder="Product"
                      />
                    </th>
                    <th className="px-3 py-2" />
                  </>
                ) : (
                  <>
                    <th className="px-2 py-2">
                      <ColumnFilter
                        id="error-filter-source"
                        options={sourceOptions}
                        value={filters.source}
                        onChange={(value) => setFilterValue('source', value)}
                        placeholder="Source"
                      />
                    </th>
                    <th className="px-2 py-2">
                      <ColumnFilter
                        id="error-filter-method"
                        options={methodOptions}
                        value={filters.method}
                        onChange={(value) => setFilterValue('method', value)}
                        placeholder="Method"
                      />
                    </th>
                    <th className="px-3 py-2" />
                  </>
                )}
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="error-filter-status"
                    options={statusOptions}
                    value={filters.status}
                    onChange={(value) => setFilterValue('status', value)}
                    placeholder="Status"
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilter
                    id="error-filter-code"
                    options={codeOptions}
                    value={filters.code}
                    onChange={(value) => setFilterValue('code', value)}
                    placeholder="Code"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    type="search"
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        applySearch()
                      }
                    }}
                    onBlur={applySearch}
                    placeholder={
                      side === 'frontend' ? 'message, path, page' : 'message'
                    }
                    className={COLUMN_SEARCH_CLASS}
                    aria-label="Search message"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {enrichedEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-3 py-4 text-sm text-white/50"
                  >
                    {loading ? 'Loading…' : 'No errors in this window.'}
                  </td>
                </tr>
              ) : (
                enrichedEntries.map((row) => {
                  const expanded =
                    side === 'server' &&
                    expandedId === row.id &&
                    Boolean(row.stack)

                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-white/8">
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
                        {side === 'server' ? (
                          <>
                            <td
                              className="truncate px-3 py-2"
                              title={row.area || '—'}
                            >
                              {row.area || '—'}
                            </td>
                            <td
                              className="truncate px-3 py-2"
                              title={row.productKey || '—'}
                            >
                              {row.productKey || '—'}
                            </td>
                            <td
                              className="truncate px-3 py-2 font-mono text-xs"
                              title={row.jobId || '—'}
                            >
                              {row.jobId || '—'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td
                              className="truncate px-3 py-2"
                              title={row.source || '—'}
                            >
                              {row.source || '—'}
                            </td>
                            <td
                              className="truncate px-3 py-2"
                              title={row.method || '—'}
                            >
                              {row.method || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className="truncate font-mono text-xs text-white/85"
                                  title={row.path || '—'}
                                >
                                  {row.path || '—'}
                                </span>
                                <span
                                  className="truncate text-xs text-white/45"
                                  title={row.page || ''}
                                >
                                  {row.page || ''}
                                </span>
                              </div>
                            </td>
                          </>
                        )}
                        <td className="truncate px-3 py-2 text-white/70">
                          {row.statusLabel}
                        </td>
                        <td
                          className="truncate px-3 py-2 text-white/70"
                          title={row.code || '—'}
                        >
                          {row.code || '—'}
                        </td>
                        <td className="px-3 py-2 text-red-200/90">
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => {
                              if (side !== 'server' || !row.stack) return
                              setExpandedId((prev) =>
                                prev === row.id ? '' : row.id,
                              )
                            }}
                            title={row.message || '—'}
                          >
                            <span className="line-clamp-2 break-words">
                              {row.message || '—'}
                            </span>
                            {side === 'server' && row.stack ? (
                              <span className="mt-1 block text-[11px] text-white/40">
                                {expanded ? 'Hide stack' : 'Show stack'}
                              </span>
                            ) : null}
                          </button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-black/20">
                          <td colSpan={colSpan} className="px-3 py-3">
                            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-white/60">
                              {row.stack}
                            </pre>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text as="p" variant="caption" color="muted" caseMode="sentence">
            Showing {enrichedEntries.length} on page {page} of {total}{' '}
            {side} errors.
          </Text>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </section>

      <ConfirmModal
        open={deleteConfirmOpen}
        elevated
        title={
          selectedCount === 1 ? 'Delete error log?' : 'Delete error logs?'
        }
        description="This removes the selected error logs from the database."
        detail={
          selectedCount === 1
            ? '1 selected log'
            : `${selectedCount} selected logs`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteConfirm}
        confirmLoading={deleting}
        closeAriaLabel="Close delete confirmation"
      />
    </div>
  )
}
