import { createSlice } from '@reduxjs/toolkit'
import {
  generatePhotoLabAdminPreview,
  generatePhotoLabClientImage,
  createPhotoLabTemplate,
  getPhotoLabTemplates,
  deletePhotoLabTemplate,
} from './photo-lab-operations'

function removeTemplateFromGroupedTemplates(templates = {}, deletedId) {
  const next = { ...templates }

  Object.keys(next).forEach((modeKey) => {
    next[modeKey] = (next[modeKey] || []).filter(
      (item) => String(item?._id) !== String(deletedId),
    )
  })

  return next
}

const initialState = {
  error: null,
  message: null,
  adminPreviewLoading: false,
  adminPreview: null,

  templateCreateLoading: false,

  templates: {
    professional_portrait: [],
    restore_colorize: [],
    smart_edit: [],
    remove_objects: [],
    enhance_quality: [],
    creative_retouch: [],
  },
  templatesLoading: false,
}

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Oops, something went wrong, try again'

const photoLabSlice = createSlice({
  name: 'photoLab',
  initialState,
  reducers: {
    clearPhotoLabError: (state) => {
      state.error = null
    },
    clearPhotoLabMessage: (state) => {
      state.message = null
    },
    setPhotoLabError: (state, action) => {
      state.error = action.payload
    },
    setPhotoLabMessage: (state, action) => {
      state.message = action.payload
    },
    clearPhotoLabAdminPreview: (state) => {
      state.adminPreview = null
      state.error = null
      state.message = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generatePhotoLabAdminPreview.pending, (state) => {
        state.adminPreviewLoading = true
        state.error = null
        state.message = null
      })
      .addCase(generatePhotoLabAdminPreview.fulfilled, (state, { payload }) => {
        state.adminPreviewLoading = false
        state.adminPreview = payload
        state.message = payload?.message || 'Photo Lab preview generated'
      })
      .addCase(generatePhotoLabAdminPreview.rejected, (state, { payload }) => {
        state.adminPreviewLoading = false
        state.error = errMsg(payload)
      })
      .addCase(generatePhotoLabClientImage.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(generatePhotoLabClientImage.fulfilled, (state, { payload }) => {
        state.message = payload?.message || 'Image generated successfully'
      })
      .addCase(generatePhotoLabClientImage.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      .addCase(createPhotoLabTemplate.pending, (state) => {
        state.templateCreateLoading = true
        state.error = null
        state.message = null
      })
      .addCase(createPhotoLabTemplate.fulfilled, (state, { payload }) => {
        state.templateCreateLoading = false
        state.message = payload?.message || 'Photo Lab template created'
      })
      .addCase(createPhotoLabTemplate.rejected, (state, { payload }) => {
        state.templateCreateLoading = false
        state.error = errMsg(payload)
      })
      .addCase(getPhotoLabTemplates.pending, (state) => {
        state.templatesLoading = true
        state.error = null
      })
      .addCase(getPhotoLabTemplates.fulfilled, (state, { payload }) => {
        state.templatesLoading = false
        state.templates = payload?.templates || {
          professional_portrait: [],
          restore_colorize: [],
          smart_edit: [],
          remove_objects: [],
          enhance_quality: [],
          creative_retouch: [],
        }
      })
      .addCase(getPhotoLabTemplates.rejected, (state, { payload }) => {
        state.templatesLoading = false
        state.error = errMsg(payload)
      })
      .addCase(deletePhotoLabTemplate.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(deletePhotoLabTemplate.fulfilled, (state, { payload }) => {
        state.message =
          payload?.message || 'Photo Lab template deleted successfully'

        const deletedId = payload?.id

        if (deletedId) {
          state.templates = removeTemplateFromGroupedTemplates(
            state.templates,
            deletedId,
          )
        }
      })
      .addCase(deletePhotoLabTemplate.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
  },
})

export const {
  clearPhotoLabError,
  clearPhotoLabMessage,
  clearPhotoLabAdminPreview,
  setPhotoLabError,
  setPhotoLabMessage,
} = photoLabSlice.actions

export default photoLabSlice.reducer
