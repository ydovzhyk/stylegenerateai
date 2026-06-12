import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosGetCategories,
  axiosGenerateReadyTemplatePreview,
  axiosCreateReadyTemplate,
  axiosDeleteReadyTemplate,
  axiosHideReadyTemplateFromCreateYourLook,
  axiosEditReadyTemplate,
  axiosResolvePromptMetadata,
  axiosGetYourLookPreviewTemplates,
  axiosGetYourLookSearchTemplates,
  axiosGenerateYourLookClientImage,
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
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosGetCategories(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const resolvePromptMetadata = createAsyncThunk(
  'ready-templates/resolve-prompt-metadata',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await axiosResolvePromptMetadata(payload)
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

export const getYourLookPreviewTemplates = createAsyncThunk(
  'ready-templates/get-your-look-preview',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await axiosGetYourLookPreviewTemplates(params)
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
  },
)

export const hideReadyTemplateFromCreateYourLook = createAsyncThunk(
  'ready-templates/hide-from-create-your-look',
  async (id, { rejectWithValue }) => {
    try {
      const data = await axiosHideReadyTemplateFromCreateYourLook(id)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const editReadyTemplate = createAsyncThunk(
  'ready-templates/editReadyTemplate',
  async ({ id, ...userData }, { rejectWithValue, dispatch }) => {
    try {
      const data = await axiosEditReadyTemplate(id, userData)
      dispatch(
        getYourLookPreviewTemplates({
          limit: 5,
          excludeIds: [],
          mode: 'replace',
        }),
      )
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
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

export const getYourLookSearchTemplates = createAsyncThunk(
  'ready-templates/get-your-look-search',
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosGetYourLookSearchTemplates(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const generateYourLookClientImage = createAsyncThunk(
  'ready-templates/generate-your-look',
  async (formData, { rejectWithValue }) => {
    try {
      const data = await axiosGenerateYourLookClientImage(formData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)
