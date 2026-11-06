'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import GallerySectionSlider from '@/components/gallery/GallerySectionSlider'
import ConfirmModal from '@/components/shared/confirm-modal/ConfirmModal'
import ImagePreviewModal from '@/components/shared/image-preview-modal/ImagePreviewModal'
import Text from '@/components/shared/text/Text'
import { GALLERY_SECTIONS } from '@/constants/gallery-sections'
import {
  deleteGeneratedImage,
  fetchGeneratedImages,
} from '@/store/generated-image/generated-image-operations'
import {
  getGeneratedImageDeleteLoadingId,
  getGeneratedImageListLoading,
  getGeneratedImagesBySection,
} from '@/store/generated-image/generated-image-selectors'

export default function MyGalleryPage() {
  const dispatch = useDispatch()
  const listLoading = useSelector(getGeneratedImageListLoading)
  const deleteLoadingId = useSelector(getGeneratedImageDeleteLoadingId)
  const looksItems = useSelector(getGeneratedImagesBySection('looks'))
  const photoLabItems = useSelector(getGeneratedImagesBySection('photo_lab'))

  const [pendingDeleteItem, setPendingDeleteItem] = useState(null)
  const [previewModal, setPreviewModal] = useState({
    open: false,
    src: '',
    alt: '',
    title: '',
  })

  useEffect(() => {
    GALLERY_SECTIONS.forEach((section) => {
      dispatch(fetchGeneratedImages(section.id))
    })
  }, [dispatch])

  const handleDeleteRequest = (item) => {
    setPendingDeleteItem(item)
  }

  const closeDeleteModal = () => {
    if (deleteLoadingId) return
    setPendingDeleteItem(null)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteItem?._id) return

    try {
      await dispatch(deleteGeneratedImage(pendingDeleteItem._id)).unwrap()
      setPendingDeleteItem(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handlePreview = (item) => {
    const src = item?.previewUrl || item?.imageUrl || ''
    if (!src) return

    setPreviewModal({
      open: true,
      src,
      alt: item?.title || 'Saved image',
      title: item?.title || 'Saved image',
    })
  }

  const closePreview = () => {
    setPreviewModal({
      open: false,
      src: '',
      alt: '',
      title: '',
    })
  }

  return (
    <div>
      <div className="mb-6 max-w-3xl sm:mb-7 md:mb-8">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          user · gallery
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          My Gallery
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Browse saved previews and download full-resolution exports from your
          Looks and Photo Lab generations.
        </Text>
      </div>

      <div className="grid gap-6">
        {GALLERY_SECTIONS.map((section) => (
          <GallerySectionSlider
            key={section.id}
            title={section.label}
            description={
              section.id === 'looks'
                ? 'Images saved from Create Your Look.'
                : 'Images saved from all Photo Lab modes.'
            }
            items={
              section.id === 'looks'
                ? looksItems
                : photoLabItems
            }
            deleteLoadingId={deleteLoadingId}
            onDelete={handleDeleteRequest}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {listLoading ? (
        <Text
          as="p"
          variant="caption"
          color="muted"
          caseMode="sentence"
          className="mt-4"
        >
          Loading gallery...
        </Text>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingDeleteItem)}
        elevated
        title="Delete saved image?"
        description="This will remove the preview and full export from your gallery."
        detail={pendingDeleteItem?.title || null}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        confirmLoading={Boolean(deleteLoadingId)}
        closeAriaLabel="Close delete confirmation"
      />

      <ImagePreviewModal
        open={previewModal.open}
        onClose={closePreview}
        src={previewModal.src}
        alt={previewModal.alt}
        title={previewModal.title}
      />
    </div>
  )
}
