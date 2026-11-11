'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Text from '@/components/shared/text/Text'
import FullPromptModal from '@/components/shared/prompt-read-more/FullPromptModal'

export default function PromptReadMore({
  prompt = '',
  label = 'Prompt used',
  modalTitle = 'Full prompt',
  clampLines = 3,
  className = '',
  textClassName = '',
}) {
  const text = String(prompt || '').trim()
  const labelText = String(label || '').trim()
  const textRef = useRef(null)
  const [isClamped, setIsClamped] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (!el || !text) {
      setIsClamped(false)
      return undefined
    }

    const measure = () => {
      setIsClamped(el.scrollHeight > el.clientHeight + 1)
    }

    // Wait a frame so line-clamp layout is applied before measuring.
    const raf = window.requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      window.cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [text, clampLines])

  if (!text) return null

  return (
    <div className={className}>
      {labelText ? (
        <Text as="p" variant="caption" color="soft" caseMode="sentence">
          {labelText}
        </Text>
      ) : null}
      <p
        ref={textRef}
        className={clsx(
          'whitespace-pre-wrap break-words text-sm font-normal leading-5 text-foreground-faint md:text-base md:leading-6',
          labelText ? 'mt-1' : null,
          textClassName,
        )}
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: clampLines,
          overflow: 'hidden',
        }}
      >
        {text}
      </p>
      {isClamped ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-1.5 text-left text-sm font-medium text-primary-soft transition hover:text-primary"
        >
          Read more
        </button>
      ) : null}

      <FullPromptModal
        open={modalOpen}
        title={modalTitle}
        prompt={text}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
