import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosGetCategories,
  axiosGenerateReadyTemplatePreview,
  axiosCreateReadyTemplate,
  axiosDeleteReadyTemplate,
  axiosEditReadyTemplate,
  axiosGetCategory,
} from '@/services/api/ready-template'
import { axiosAutogenerateReadyTemplates } from '../../services/api/autogenerate'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || {
    message: error?.message || 'Request failed',
  }
  return rejectWithValue({ status, data })
}

export const getCategories = createAsyncThunk(
  'ready-templates/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const data = await axiosGetCategories()
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getCategory = createAsyncThunk(
  'ready-templates/get-category',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await axiosGetCategory(payload)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)


export const generateReadyTemplatePreview = createAsyncThunk(
  'ready-templates/generatePreview',
  async (formData, { rejectWithValue }) => {
    try {
      const data = await axiosGenerateReadyTemplatePreview(formData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)
export const createReadyTemplate = createAsyncThunk(
  'ready-templates/createReadyTemplate',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosCreateReadyTemplate(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const deleteReadyTemplate = createAsyncThunk(
  'ready-templates/deleteReadyTemplate',
  async (id, { rejectWithValue }) => {
    try {
      const data = await axiosDeleteReadyTemplate(id)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const editReadyTemplate = createAsyncThunk(
  'ready-templates/editReadyTemplate',
  async ({ id, ...userData }, { rejectWithValue }) => {
    try {
      const data = await axiosEditReadyTemplate(id, userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const autogenerateReadyTemplates = createAsyncThunk(
  'autogenerate/ready-templates',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await axiosAutogenerateReadyTemplates(payload)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)