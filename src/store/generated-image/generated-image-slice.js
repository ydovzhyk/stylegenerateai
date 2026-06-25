import { createSlice } from '@reduxjs/toolkit'
import {
  createGeneratedImage,
  deleteGeneratedImage,
  fetchGeneratedImages,
} from './generated-image-operations'

const initialState = {
  items: [],
  itemsBySection: {
    looks: [],
    photo_lab: [],
  },
  loading: false,
  listLoading: false,
  deleteLoadingId: null,
  error: null,
  message: null,
}

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Oops, something went wrong, try again'

const generatedImageSlice = createSlice({
  name: 'generatedImage',
  initialState,
  reducers: {
    clearGeneratedImageError: (state) => {
      state.error = null
    },
    clearGeneratedImageMessage: (state) => {
      state.message = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGeneratedImage.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(createGeneratedImage.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = payload?.message || 'Image saved to gallery'

        if (payload?.generatedImage) {
          state.items.unshift(payload.generatedImage)

          if (payload.generatedImage.sourceType === 'create_your_look') {
            state.itemsBySection.looks.unshift(payload.generatedImage)
          } else {
            state.itemsBySection.photo_lab.unshift(payload.generatedImage)
          }
        }
      })
      .addCase(createGeneratedImage.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
      .addCase(fetchGeneratedImages.pending, (state) => {
        state.listLoading = true
        state.error = null
      })
      .addCase(fetchGeneratedImages.fulfilled, (state, { payload }) => {
        state.listLoading = false

        if (payload.section === 'all') {
          state.items = payload.items
          return
        }

        state.itemsBySection[payload.section] = payload.items
      })
      .addCase(fetchGeneratedImages.rejected, (state, { payload }) => {
        state.listLoading = false
        state.error = errMsg(payload)
      })
      .addCase(deleteGeneratedImage.pending, (state, { meta }) => {
        state.deleteLoadingId = meta.arg
        state.error = null
      })
      .addCase(deleteGeneratedImage.fulfilled, (state, { payload }) => {
        state.deleteLoadingId = null
        state.message = payload?.message || 'Gallery image deleted'
        state.items = state.items.filter((item) => item._id !== payload.id)
        state.itemsBySection.looks = state.itemsBySection.looks.filter(
          (item) => item._id !== payload.id,
        )
        state.itemsBySection.photo_lab = state.itemsBySection.photo_lab.filter(
          (item) => item._id !== payload.id,
        )
      })
      .addCase(deleteGeneratedImage.rejected, (state, { payload }) => {
        state.deleteLoadingId = null
        state.error = errMsg(payload)
      })
  },
})

export const { clearGeneratedImageError, clearGeneratedImageMessage } =
  generatedImageSlice.actions

export default generatedImageSlice.reducer
