'use client'

import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import { getGeneratedImageFormat } from '@/constants/generated-image-formats'
import { axiosDownloadGeneratedImageFile } from '@/services/api/generated-image'

export const GALLERY_CARD_SHELL_CLASS =
  'relative w-full overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm'

function buildDownloadFileName(title, extension) {
  const safeTitle =
    String(title || 'generated-image')
      .trim()
      .replace(/[^\w\-]+/g, '-')
      .slice(0, 80) || 'generated-image'

  return `${safeTitle}.${extension}`
}

export default function GalleryImageCard({
  item,
  deleting = false,
  onDelete,
  onPreview,
}) {
  const [downloading, setDownloading] = useState(false)
  const previewSrc = item?.previewUrl || item?.imageUrl || ''

  const handleDownload = async () => {
    if (!item?._id || downloading) return

    setDownloading(true)

    try {
      const { blob } = await axiosDownloadGeneratedImageFile(item._id)
      const fileFormat = getGeneratedImageFormat(item.format)
      const fileName = buildDownloadFileName(item.title, fileFormat.extension)
      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 1000)
    } catch (error) {
      console.error(error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex w-[calc(100vw-64px)] max-w-[360px] shrink-0 flex-col sm:w-[300px] md:w-[320px] lg:w-[270px] xl:w-[280px]">
      <article
        className={`${GALLERY_CARD_SHELL_CLASS} ${
          previewSrc ? 'cursor-zoom-in' : ''
        }`}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-background-soft/60">
          {previewSrc ? (
            <>
              <button
                type="button"
                onClick={() => onPreview?.(item)}
                aria-label={`Open ${item?.title || 'saved image'} preview`}
                className="absolute inset-0 z-[1] cursor-zoom-in"
              />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={item?.title || 'Saved image'}
                className="absolute inset-[-1px] h-[calc(100%+2px)] w-[calc(100%+2px)] object-cover object-[50%_5%]"
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-foreground-faint">
              No preview
            </div>
          )}
        </div>
      </article>

      <Text
        as="p"
        variant="sub-block-label"
        color="white"
        caseMode="sentence"
        className="mt-3 line-clamp-2"
      >
        {item?.title || 'Untitled'}
      </Text>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          loading={downloading}
          disabled={downloading || deleting}
          onClick={handleDownload}
          className="h-10 rounded-full px-3 text-xs sm:text-sm"
        >
          <span className="inline-flex items-center gap-1.5">
            <Download size={14} />
            Download
          </span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          loading={deleting}
          disabled={deleting || downloading}
          onClick={() => onDelete?.(item)}
          className="h-10 rounded-full px-3 text-xs sm:text-sm"
        >
          <span className="inline-flex items-center gap-1.5">
            <Trash2 size={14} />
            Delete
          </span>
        </Button>
      </div>
    </div>
  )
}
