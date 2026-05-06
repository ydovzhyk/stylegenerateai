'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  getCategories,
  getYourLookSearchTemplates,
} from '@/store/ready-template/ready-template-operations'
import {
  getCreateYourLookSearchParams,
  getReadyTemplateCategories,
  getYourLookSearchLoading,
  getIsEmptyResultsSearch,
} from '@/store/ready-template/ready-template-selectors'
import {
  setCreateYourLookSearchParams,
  setIsManualSearch,
} from '@/store/ready-template/ready-template-slice'

import { useTranslate, translateTextTo } from '@/utils/translate/translate'
import { useLanguage } from '@/providers/languageContext'
import languagesAndCodes from '@/utils/translate/languagesAndCodes'

import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'

import { ChevronLeft, ChevronRight } from 'lucide-react'

function getPageSize(width) {
  if (width < 640) return 5
  if (width < 1024) return 7
  return 10
}

function chunkArray(items = [], size = 8) {
  const result = []

  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }

  return result
}

function TranslatedInlineText({ text, className, caseMode = 'auto' }) {
  const translated = useTranslate(text, { caseMode })

  return <span className={className}>{translated}</span>
}

export default function CreateYourLookSearch() {
  const dispatch = useDispatch()
  const { languageIndex } = useLanguage()

  const categories = useSelector(getReadyTemplateCategories) || []
  const appliedSearchParams = useSelector(getCreateYourLookSearchParams)
  const yourLookSearchLoading = useSelector(getYourLookSearchLoading)
  const isEmptyResultsSearch = useSelector(getIsEmptyResultsSearch)

  const [localQuery, setLocalQuery] = useState(appliedSearchParams?.query || '')
  const [localSelectedCategory, setLocalSelectedCategory] = useState(
    appliedSearchParams?.selectedCategory || 'All',
  )

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(8)

  const previousSelectedCategoryRef = useRef(localSelectedCategory)

  useEffect(() => {
    dispatch(getCategories({ withCount: true }))
  }, [dispatch])

  useEffect(() => {
    dispatch(
      getYourLookSearchTemplates({
        ...appliedSearchParams,
        mode: 'replace',
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  useEffect(() => {
    const updatePageSize = () => {
      if (typeof window === 'undefined') return
      setPageSize(getPageSize(window.innerWidth))
    }

    updatePageSize()
    window.addEventListener('resize', updatePageSize)

    return () => window.removeEventListener('resize', updatePageSize)
  }, [])

  const visibleCategories = useMemo(() => {
    return categories
      .filter((item) => Number(item?.templatesCount || 0) > 0)
      .sort((a, b) => {
        const clickDiff =
          Number(b?.clickCount || 0) - Number(a?.clickCount || 0)

        if (clickDiff !== 0) return clickDiff

        return Number(b?.templatesCount || 0) - Number(a?.templatesCount || 0)
      })
  }, [categories])

  const searchStats = useMemo(() => {
    const totalTemplates = visibleCategories.reduce(
      (sum, item) => sum + Number(item?.templatesCount || 0),
      0,
    )

    return {
      totalCategories: visibleCategories.length,
      totalTemplates,
    }
  }, [visibleCategories])

  const translatedStatsText = useTranslate(
    `Explore ${searchStats.totalTemplates} looks across ${searchStats.totalCategories} categories`,
    { caseMode: 'sentence' },
  )

  const emptyResultsText = useTranslate(
    'No templates were found for your search. Try another phrase or category.',
    { caseMode: 'sentence' },
  )

  const pages = useMemo(() => {
    return chunkArray(visibleCategories, pageSize)
  }, [visibleCategories, pageSize])

  const currentPageItems = pages[page] || []
  const hasPrev = page > 0
  const hasNext = page < pages.length - 1

  const isSearchMode =
    Boolean(appliedSearchParams?.query) ||
    appliedSearchParams?.selectedCategory !== 'All'

  useEffect(() => {
    if (page > pages.length - 1) {
      setPage(0)
    }
  }, [page, pages.length])

  useEffect(() => {
    const previousSelectedCategory = previousSelectedCategoryRef.current
    previousSelectedCategoryRef.current = localSelectedCategory

    if (localSelectedCategory === 'All') {
      setPage(0)
      return
    }

    if (previousSelectedCategory === localSelectedCategory) return

    const activeIndex = visibleCategories.findIndex(
      (item) => item?.value === localSelectedCategory,
    )

    if (activeIndex === -1) return

    const nextPage = Math.floor(activeIndex / pageSize)

    setPage(nextPage)
  }, [localSelectedCategory, visibleCategories, pageSize])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedQuery = String(localQuery || '').trim()
    const normalizedCategory = localSelectedCategory || 'All'

    let searchQuery = normalizedQuery

    const currentLangCode =
      languagesAndCodes?.languages?.[languageIndex]?.code || 'en'

    if (normalizedQuery && currentLangCode !== 'en') {
      searchQuery = await translateTextTo(
        normalizedQuery,
        'en',
        currentLangCode,
      )
    }

    const nextParams = {
      query: searchQuery,
      selectedCategory: normalizedCategory,
      page: 1,
      limit: appliedSearchParams?.limit || 10,
    }

    dispatch(setIsManualSearch(true))
    dispatch(setCreateYourLookSearchParams(nextParams))
    dispatch(
      getYourLookSearchTemplates({
        ...nextParams,
        mode: 'replace',
      }),
    )
  }

  return (
    <section className="gradient-border-card p-5 sm:p-6 lg:p-7">
      <div className="max-w-3xl">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          Search your look
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl"
        >
          Search by style, mood, or phrase and refine results by category.
        </Text>

        <Text
          as="p"
          variant="body-sm"
          color="soft"
          translate={false}
          className="mt-2"
        >
          {translatedStatsText}
        </Text>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.02] p-4 sm:p-5"
      >
        <Input
          id="create-your-look-search"
          type="text"
          placeholder="Search styles, moods, looks..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          inputClassName="h-[40px] rounded-full w-full md:w-1/2"
          caseMode="sentence"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant={localSelectedCategory === 'All' ? 'primary' : 'secondary'}
            onClick={() => {
              setLocalSelectedCategory('All')
              setPage(0)
            }}
            size="sm"
            className="rounded-full px-5"
          >
            <span className="inline-flex items-center gap-2">
              <TranslatedInlineText text="All" />
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] leading-none text-white/80">
                {searchStats.totalTemplates}
              </span>
            </span>
          </Button>

          {hasPrev ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              size="sm"
              className="rounded-full px-5"
              aria-label="Previous categories"
            >
              <ChevronLeft size={16} />
            </Button>
          ) : null}

          {currentPageItems.map((item) => {
            const isActive = localSelectedCategory === item.value

            return (
              <Button
                key={item.value}
                type="button"
                variant={isActive ? 'primary' : 'secondary'}
                onClick={() => {
                  setLocalSelectedCategory(item.value)
                }}
                size="sm"
                className="rounded-full px-5"
              >
                <span className="inline-flex items-center gap-2">
                  <TranslatedInlineText
                    text={item.value}
                    className="max-w-[180px] truncate"
                  />
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] leading-none text-white/80">
                    {item.templatesCount}
                  </span>
                </span>
              </Button>
            )
          })}

          {hasNext ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, pages.length - 1))
              }
              size="sm"
              className="rounded-full px-5"
              aria-label="Next categories"
            >
              <ChevronRight size={16} />
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex justify-start border-t border-white/8 pt-4">
          <Button
            type="submit"
            variant="primary"
            loading={yourLookSearchLoading}
            size="sm"
            className="rounded-full px-6"
          >
            Search
          </Button>
        </div>
      </form>

      {!yourLookSearchLoading && isSearchMode && isEmptyResultsSearch ? (
        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.02] px-4 py-3">
          <Text as="p" variant="body-sm" color="muted" caseMode="sentence">
            {emptyResultsText}
          </Text>
        </div>
      ) : null}
    </section>
  )
}