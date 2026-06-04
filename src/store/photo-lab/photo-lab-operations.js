import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosGeneratePhotoLabAdminPreview,
  axiosCreatePhotoLabTemplate,
  axiosGetPhotoLabTemplates,
} from '@/services/api/photo-lab'

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

export const createPhotoLabTemplate = createAsyncThunk(
  'photo-lab/create-template',
  async (formData, { rejectWithValue }) => {
    try {
      return await axiosCreatePhotoLabTemplate(formData)
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const getPhotoLabTemplates = createAsyncThunk(
  'photo-lab/get-templates',
  async (_, { rejectWithValue }) => {
    try {
      return await axiosGetPhotoLabTemplates()
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)
