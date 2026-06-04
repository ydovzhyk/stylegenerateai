import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosGeneratePhotoLabAdminPreview } from '@/services/api/photo-lab'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || {
    message: error?.message || 'Request failed',
  }

  return rejectWithValue({ status, data })
}

export const generatePhotoLabAdminPreview = createAsyncThunk(
  'photo-lab/generate-admin-preview',
  async (formData, { rejectWithValue }) => {
    try {
      return await axiosGeneratePhotoLabAdminPreview(formData)
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)
