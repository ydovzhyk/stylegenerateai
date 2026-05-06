export const getGeneratedImageLoading = ({ generatedImage }) =>
  generatedImage.loading

export const getGeneratedImageError = ({ generatedImage }) =>
  generatedImage.error

export const getGeneratedImageMessage = ({ generatedImage }) =>
  generatedImage.message

export const getGeneratedImages = ({ generatedImage }) => generatedImage.items
