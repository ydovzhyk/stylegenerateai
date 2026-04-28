import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosGetGenerationUsage } from '@/services/api/generation-usage'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || {
    message: error?.message || 'Request failed',
  }
  return rejectWithValue({ status, data })
}

export const getGenerationUsage = createAsyncThunk(
  'generation-usage/get',
  async (_, { rejectWithValue }) => {
    try {
      const data = await axiosGetGenerationUsage()
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)