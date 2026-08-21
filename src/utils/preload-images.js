'use client'

import { useEffect, useMemo } from 'react'

const preloadedUrls = new Set()

function normalizeUrl(url) {
  const value = String(url || '').trim()
  return value || ''
}

export function collectShowcaseItemUrls(item) {
  if (!item || typeof item !== 'object') return []

  return [item.beforeSrc, item.afterSrc, item.faceSrc]
    .map(normalizeUrl)
    .filter(Boolean)
}

export function collectRotationPreloadUrls(items = [], activeIndex = 0, ahead = 2) {
  if (!Array.isArray(items) || items.length === 0) return []

  const urls = []
  const safeIndex = ((Number(activeIndex) || 0) % items.length + items.length) % items.length
  const lookAhead = Math.max(0, Math.min(Number(ahead) || 0, items.length - 1))

  for (let offset = 0; offset <= lookAhead; offset += 1) {
    const index = (safeIndex + offset) % items.length
    urls.push(...collectShowcaseItemUrls(items[index]))
  }

  return [...new Set(urls)]
}

export function preloadImages(urls = []) {
  if (typeof window === 'undefined') return

  const unique = [...new Set((urls || []).map(normalizeUrl).filter(Boolean))]

  unique.forEach((url) => {
    if (preloadedUrls.has(url)) return
    preloadedUrls.add(url)

    const image = new window.Image()
    image.decoding = 'async'
    image.src = url
  })
}

export function usePreloadImages(urls = []) {
  const stableKey = useMemo(() => {
    const unique = [...new Set((urls || []).map(normalizeUrl).filter(Boolean))]
    unique.sort()
    return unique.join('\n')
  }, [urls])

  useEffect(() => {
    if (!stableKey) return
    preloadImages(stableKey.split('\n').filter(Boolean))
  }, [stableKey])
}

export function isRemoteImageSrc(src = '') {
  return /^https?:\/\//i.test(String(src || '').trim())
}
