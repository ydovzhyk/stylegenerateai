import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateImagineTemplate,
  axiosDeleteImagineTemplate,
  axiosGetImagineTemplates,
} from '@/services/api/imagine'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || {
    message: error?.message || 'Request failed',
  }

  return rejectWithValue({ status, data })
}

export const getImagineTemplates = createAsyncThunk(
  'imagine/get-templates',
  async (_, { rejectWithValue }) => {
    try {
      return await axiosGetImagineTemplates()
    } catch (error) {
      return toReject(error, rejectWithValue)
    }
  },
)

export const createImagineTemplate = createAsyncThunk(
  'imagine/create-template',
  async (formData, { rejectWithValue }) => {
    try {
      return await axiosCreateImagineTemplate(formData)
    } catch (error) {
      return toReject(error, rejectWithValue)
    }
  },
)

export const deleteImagineTemplate = createAsyncThunk(
  'imagine/delete-template',
  async (id, { rejectWithValue }) => {
    try {
      return await axiosDeleteImagineTemplate(id)
    } catch (error) {
      return toReject(error, rejectWithValue)
    }
  },
)
