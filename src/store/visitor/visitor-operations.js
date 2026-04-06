import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosUpdateVisitor, axiosGetVisitor } from '../../services/api/visitor'

const VISITOR_KEY = 'style-generate-ai:visitorId'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

export const initVisitor = createAsyncThunk(
  'visitor/init',
  async (_, { rejectWithValue }) => {
    try {
      const existingId =
        typeof window !== 'undefined' ? localStorage.getItem(VISITOR_KEY) : null

      const data = await axiosGetVisitor({ visitorId: existingId })

      const visitorId = String(data?.visitorId || '').trim()
      if (visitorId && typeof window !== 'undefined') {
        localStorage.setItem(VISITOR_KEY, visitorId)
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

export const updateVisitor = createAsyncThunk(
  'visitor/update',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosUpdateVisitor(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
);
