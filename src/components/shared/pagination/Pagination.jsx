'use client'

import clsx from 'clsx'
import Text from '@/components/shared/text/Text'

export default function Pagination({
  page = 1,
  totalPages = 1,
  onChange,
  className,
}) {
  if (totalPages <= 1) return null

  const goTo = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return
    onChange?.(nextPage)
  }

  return (
    <div
      className={clsx(
        'flex flex-row flex-wrap items-center gap-3',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Text as="span" variant="caption" color="soft" caseMode="sentence">
          Prev
        </Text>
      </button>

      <div className="flex flex-row flex-wrap gap-2">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1
          const active = pageNumber === page
          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => goTo(pageNumber)}
              className={clsx(
                'inline-flex h-9 w-[30px] items-center justify-center rounded-lg outline-none transition',
                active
                  ? 'border border-white/25 bg-white/[0.08] font-semibold text-white'
                  : 'text-white/45 hover:text-white/80',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Text
                as="span"
                variant="caption"
                color={active ? 'white' : 'muted'}
                caseMode="sentence"
              >
                {pageNumber}
              </Text>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Text as="span" variant="caption" color="soft" caseMode="sentence">
          {page >= totalPages ? 'Last' : 'Next'}
        </Text>
      </button>
    </div>
  )
}
