'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getCategories } from '@/store/ready-template/ready-template-operations'
import {
  getCreateYourLookSearchParams,
  getReadyTemplateCategories,
} from '@/store/ready-template/ready-template-selectors'
import { setCreateYourLookSearchParams } from '@/store/ready-template/ready-template-slice'

import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'

function getPageSize(width) {
  if (width < 640) return 4
  if (width < 1024) return 6
  return 8
}

function chunkArray(items = [], size = 8) {
  const result = []

  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }

  return result
}

export default function CreateYourLookSearch() {
  const dispatch = useDispatch()

  const categories = useSelector(getReadyTemplateCategories) || []
  const { query, selectedCategory } = useSelector(getCreateYourLookSearchParams)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(8)

  useEffect(() => {
    dispatch(getCategories())
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

  const pages = useMemo(() => {
    return chunkArray(visibleCategories, pageSize)
  }, [visibleCategories, pageSize])

  const currentPageItems = pages[page] || []
  const hasPrev = page > 0
  const hasNext = page < pages.length - 1

  useEffect(() => {
    if (page > pages.length - 1) {
      setPage(0)
    }
  }, [page, pages.length])

  useEffect(() => {
    if (selectedCategory === 'All') return

    const activeIndex = visibleCategories.findIndex(
      (item) => item?.value === selectedCategory,
    )

    if (activeIndex === -1) return

    const nextPage = Math.floor(activeIndex / pageSize)

    if (nextPage !== page) {
      setPage(nextPage)
    }
  }, [selectedCategory, visibleCategories, pageSize, page])

  return (
    <section className="gradient-border-card p-4 sm:p-5 md:p-6">
      <div className="mb-5 max-w-2xl">
        <Text as="h2" variant="h3" color="white" caseMode="sentence">
          Search your look
        </Text>

        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2"
        >
          Search by style, mood, or phrase and refine results by category.
        </Text>
      </div>

      <div className="grid gap-4">
        <Input
          id="create-your-look-search"
          type="text"
          label="Search"
          placeholder="Search styles, moods, looks..."
          value={query}
          onChange={(e) => {
            dispatch(
              setCreateYourLookSearchParams({
                query: e.target.value,
                page: 1,
              }),
            )
            setPage(0)
          }}
          inputClassName="h-11"
          caseMode="sentence"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={selectedCategory === 'All' ? 'primary' : 'secondary'}
            onClick={() => {
              dispatch(
                setCreateYourLookSearchParams({
                  selectedCategory: 'All',
                  page: 1,
                }),
              )
              setPage(0)
            }}
            className="min-h-10 rounded-full px-4"
          >
            All
          </Button>

          {hasPrev ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              className="min-h-10 rounded-full px-4"
            >
              ← Previous
            </Button>
          ) : null}

          {currentPageItems.map((item) => {
            const isActive = selectedCategory === item.value

            return (
              <Button
                key={item.value}
                type="button"
                variant={isActive ? 'primary' : 'secondary'}
                onClick={() =>
                  dispatch(
                    setCreateYourLookSearchParams({
                      selectedCategory: item.value,
                      page: 1,
                    }),
                  )
                }
                className="min-h-10 rounded-full px-4"
              >
                <span className="inline-flex items-center gap-2">
                  <span>{item.value}</span>
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] leading-none text-white/80">
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
              className="min-h-10 rounded-full px-4"
            >
              More →
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
