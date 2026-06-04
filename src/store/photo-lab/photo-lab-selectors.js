export const getPhotoLabError = (state) => state.photoLab.error
export const getPhotoLabMessage = (state) => state.photoLab.message
export const getPhotoLabAdminPreview = (state) => state.photoLab.adminPreview
export const getPhotoLabAdminPreviewLoading = (state) =>
  state.photoLab.adminPreviewLoading
export const getPhotoLabTemplateCreateLoading = (state) =>
  state.photoLab.templateCreateLoading
export const getPhotoLabTemplatesState = (state) => state.photoLab.templates

export const getPhotoLabTemplatesLoading = (state) =>
  state.photoLab.templatesLoading

export const getPhotoLabTemplatesByMode = (mode) => (state) =>
  state.photoLab.templates?.[mode] || []