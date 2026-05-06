import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateGeneratedImage,
} from '@/services/api/generated-image'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || {
    message: error?.message || 'Request failed',
  }

  return rejectWithValue({ status, data })
}

export const createGeneratedImage = createAsyncThunk(
  'generated-image/create',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await axiosCreateGeneratedImage(payload)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

