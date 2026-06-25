export const getGeneratedImageLoading = ({ generatedImage }) =>
  generatedImage.loading

export const getGeneratedImageListLoading = ({ generatedImage }) =>
  generatedImage.listLoading

export const getGeneratedImageDeleteLoadingId = ({ generatedImage }) =>
  generatedImage.deleteLoadingId

export const getGeneratedImageError = ({ generatedImage }) =>
  generatedImage.error

export const getGeneratedImageMessage = ({ generatedImage }) =>
  generatedImage.message

export const getGeneratedImages = ({ generatedImage }) => generatedImage.items

export const getGeneratedImagesBySection = (sectionId) => ({ generatedImage }) =>
  generatedImage.itemsBySection?.[sectionId] || []
