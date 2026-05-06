import { createSlice } from '@reduxjs/toolkit'
import {
  createGeneratedImage,
} from './generated-image-operations'

const initialState = {
  items: [],
  loading: false,
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
        }
      })
      .addCase(createGeneratedImage.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export const { clearGeneratedImageError, clearGeneratedImageMessage } =
  generatedImageSlice.actions

export default generatedImageSlice.reducer
