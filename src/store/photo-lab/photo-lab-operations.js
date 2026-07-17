import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosGeneratePhotoLabAdminPreview,
  axiosGeneratePhotoLabClientImage,
  axiosCreatePhotoLabTemplate,
  axiosGetPhotoLabTemplates,
  axiosDeletePhotoLabTemplate,
} from '@/services/api/photo-lab'
import { getGenerationUsage } from '../generation-usage/generation-usage-operations'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || {
    message: error?.message || 'Request failed',
  }

  return rejectWithValue({ status, data })
}

export const generatePhotoLabAdminPreview = createAsyncThunk(
  'photo-lab/generate-admin-preview',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const data = await axiosGeneratePhotoLabAdminPreview(formData)
      dispatch(getGenerationUsage())
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const generatePhotoLabClientImage = createAsyncThunk(
  'photo-lab/generate-client-image',
  async (formData, { rejectWithValue }) => {
    try {
      return await axiosGeneratePhotoLabClientImage(formData)
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

export const deletePhotoLabTemplate = createAsyncThunk(
  'photo-lab/delete-template',
  async (id, { rejectWithValue }) => {
    try {
      return await axiosDeletePhotoLabTemplate(id)
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)
