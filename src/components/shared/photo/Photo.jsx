import Image from 'next/image'
import clsx from 'clsx'
import { isRemoteImageSrc } from '@/utils/preload-images'

function resolveUnoptimized(src, unoptimized) {
  if (typeof unoptimized === 'boolean') return unoptimized

  const value = String(src || '').trim()
  return (
    isRemoteImageSrc(value) ||
    /^blob:/i.test(value) ||
    /^data:/i.test(value)
  )
}

/**
 * Shared photo primitive for Next/Image.
 * Pass `fill` for absolute parents, or `width` + `height` for fixed size.
 */
export default function Photo({
  src,
  alt = '',
  fill = false,
  width,
  height,
  sizes,
  className,
  priority = false,
  quality,
  unoptimized,
  draggable = false,
  ...rest
}) {
  const resolvedSrc = String(src || '').trim()
  if (!resolvedSrc) return null

  const skipOptimization = resolveUnoptimized(resolvedSrc, unoptimized)
  const hasObjectFit = /\bobject-(?:contain|cover|fill|none|scale-down)\b/.test(
    String(className || ''),
  )
  const imageClassName = clsx(!hasObjectFit && 'object-cover', className)

  if (fill) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes={sizes || '100vw'}
        priority={priority}
        quality={quality}
        unoptimized={skipOptimization}
        draggable={draggable}
        className={imageClassName}
        {...rest}
      />
    )
  }

  const resolvedWidth = Number(width)
  const resolvedHeight = Number(height)

  if (
    !Number.isFinite(resolvedWidth) ||
    resolvedWidth <= 0 ||
    !Number.isFinite(resolvedHeight) ||
    resolvedHeight <= 0
  ) {
    return null
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={resolvedWidth}
      height={resolvedHeight}
      sizes={sizes}
      priority={priority}
      quality={quality}
      unoptimized={skipOptimization}
      draggable={draggable}
      className={imageClassName}
      {...rest}
    />
  )
}
