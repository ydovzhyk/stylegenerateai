import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosGetVisitor } from '../../services/api/visitor'
import { getGenerationUsage } from '../generation-usage/generation-usage-operations'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

export const initVisitor = createAsyncThunk(
  'visitor/init',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosGetVisitor()

      const visitorId = String(data?.visitorId || '').trim()

      if (visitorId) {
        dispatch(getGenerationUsage())
      }

      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
  {
    condition: (_, { getState }) => {
      const st = getState()
      const visitorId = st?.visitor?.id
      const isLogin = st?.auth?.isLogin

      if (isLogin === true) return false

      return !visitorId
    },
  },
)