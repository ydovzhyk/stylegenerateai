'use client'

import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import Photo from '@/components/shared/photo/Photo'

export default function ShowcasePreviewImage({
  src,
  alt,
  imageKey,
  wrapperClassName = 'absolute inset-0',
  objectPositionClassName = 'object-[50%_5%]',
  sizes = '(max-width: 1024px) 90vw, 42vw',
  priority = false,
  hoverScale = 1.045,
  withEntranceScale = true,
}) {
  const reducedMotion = useReducedMotion()
  const hasImage = Boolean(src)
  // Prefer CSS group-hover so an overlay preview button does not block zoom.
  // Framer must not keep an inline `scale` then, or it wins over CSS.
  const canHoverZoom = Boolean(hoverScale) && !reducedMotion
  const entranceScale = withEntranceScale && !canHoverZoom && !reducedMotion

  if (!hasImage) return null

  return (
    <motion.div
      key={imageKey || src}
      className={clsx(
        wrapperClassName,
        canHoverZoom &&
          'origin-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[var(--showcase-hover-scale)]',
      )}
      style={
        canHoverZoom
          ? { ['--showcase-hover-scale']: String(hoverScale) }
          : undefined
      }
      initial={
        reducedMotion
          ? { opacity: 0 }
          : entranceScale
            ? { opacity: 0, scale: 1.03, filter: 'blur(2px)' }
            : { opacity: 0, filter: 'blur(2px)' }
      }
      animate={
        reducedMotion
          ? { opacity: 1 }
          : entranceScale
            ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
            : { opacity: 1, filter: 'blur(0px)' }
      }
      exit={{ opacity: 0 }}
      transition={{
        duration: reducedMotion ? 0.1 : 0.95,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Photo
        src={src}
        alt={alt || ''}
        fill
        sizes={sizes}
        priority={priority}
        className={objectPositionClassName}
      />
    </motion.div>
  )
}
