import { createSlice } from '@reduxjs/toolkit'
import { generatePhotoLabAdminPreview } from './photo-lab-operations'

const initialState = {
  error: null,
  message: null,
  adminPreviewLoading: false,
  adminPreview: null,
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
  },
})

export const {
  clearPhotoLabError,
  clearPhotoLabMessage,
  clearPhotoLabAdminPreview,
} = photoLabSlice.actions

export default photoLabSlice.reducer
