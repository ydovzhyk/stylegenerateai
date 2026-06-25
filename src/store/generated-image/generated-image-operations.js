import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateGeneratedImage,
  axiosDeleteGeneratedImage,
  axiosFetchGeneratedImages,
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

export const fetchGeneratedImages = createAsyncThunk(
  'generated-image/fetch',
  async (section, { rejectWithValue }) => {
    try {
      const data = await axiosFetchGeneratedImages(section)
      return { section: section || 'all', items: data?.items || [] }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const deleteGeneratedImage = createAsyncThunk(
  'generated-image/delete',
  async (id, { rejectWithValue }) => {
    try {
      const data = await axiosDeleteGeneratedImage(id)
      return { id, ...data }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)
