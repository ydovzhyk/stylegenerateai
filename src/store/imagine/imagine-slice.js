import { createSlice } from '@reduxjs/toolkit'
import {
  createImagineTemplate,
  deleteImagineTemplate,
  getImagineTemplates,
} from './imagine-operations'

const EMPTY_TEMPLATES = {
  wallpaper: [],
  tattoo: [],
  home: [],
  painting: [],
}

function removeTemplate(templates = {}, deletedId) {
  const next = { ...templates }

  Object.keys(next).forEach((modeKey) => {
    next[modeKey] = (next[modeKey] || []).filter(
      (item) => String(item?._id) !== String(deletedId),
    )
  })

  return next
}

const imagineSlice = createSlice({
  name: 'imagine',
  initialState: {
    templates: EMPTY_TEMPLATES,
    templatesLoading: false,
    templateCreateLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearImagineError: (state) => {
      state.error = null
    },
    clearImagineMessage: (state) => {
      state.message = null
    },
    setImagineError: (state, action) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getImagineTemplates.pending, (state) => {
        state.templatesLoading = true
        state.error = null
      })
      .addCase(getImagineTemplates.fulfilled, (state, { payload }) => {
        state.templatesLoading = false
        state.templates = payload?.templates || EMPTY_TEMPLATES
      })
      .addCase(getImagineTemplates.rejected, (state, { payload }) => {
        state.templatesLoading = false
        state.error = payload?.data?.message || 'Could not load Imagine examples'
      })
      .addCase(createImagineTemplate.pending, (state) => {
        state.templateCreateLoading = true
        state.error = null
        state.message = null
      })
      .addCase(createImagineTemplate.fulfilled, (state, { payload }) => {
        state.templateCreateLoading = false
        state.message = payload?.message || 'Imagine preview saved'
      })
      .addCase(createImagineTemplate.rejected, (state, { payload }) => {
        state.templateCreateLoading = false
        state.error = payload?.data?.message || 'Could not save the preview'
      })
      .addCase(deleteImagineTemplate.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(deleteImagineTemplate.fulfilled, (state, { payload }) => {
        state.message = payload?.message || 'Imagine preview deleted'
        if (payload?.id) {
          state.templates = removeTemplate(state.templates, payload.id)
        }
      })
      .addCase(deleteImagineTemplate.rejected, (state, { payload }) => {
        state.error = payload?.data?.message || 'Could not delete the preview'
      })
  },
})

export const { clearImagineError, clearImagineMessage, setImagineError } =
  imagineSlice.actions

export default imagineSlice.reducer
