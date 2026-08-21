'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { isRemoteImageSrc } from '@/utils/preload-images'

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

  if (!hasImage) return null

  return (
    <motion.div
      key={imageKey || src}
      className={wrapperClassName}
      initial={
        reducedMotion
          ? { opacity: 0 }
          : withEntranceScale
            ? { opacity: 0, scale: 1.03, filter: 'blur(2px)' }
            : { opacity: 0, filter: 'blur(2px)' }
      }
      animate={
        reducedMotion
          ? { opacity: 1 }
          : withEntranceScale
            ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
            : { opacity: 1, filter: 'blur(0px)' }
      }
      exit={{ opacity: 0 }}
      whileHover={
        reducedMotion || !hoverScale ? undefined : { scale: hoverScale }
      }
      transition={{
        duration: reducedMotion ? 0.1 : 0.95,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Image
        src={src}
        alt={alt || ''}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isRemoteImageSrc(src)}
        className={`object-cover ${objectPositionClassName}`.trim()}
      />
    </motion.div>
  )
}
