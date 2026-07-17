import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  axiosSendRegisterCode,
  axiosRegister,
  axiosLogin,
  axiosLogout,
  axiosGetCurrentUser,
  axiosEditUser,
  axiosDeleteUser,
  axiosForgotPassword,
  axiosResetPassword,
} from '../../services/api/auth'
import { clearUser } from './auth-slice';
import { resetVisitor } from '../visitor/visitor-slice';
import { initVisitor } from '../visitor/visitor-operations'
import { getGenerationUsage } from '../generation-usage/generation-usage-operations'
import { resetGenerationUsage } from '../generation-usage/generation-usage-slice'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

export const sendRegisterCode = createAsyncThunk(
  'auth/register-send-code',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosSendRegisterCode(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const login = createAsyncThunk(
  'auth/login',
  async (userData, { dispatch, rejectWithValue }) => {
  try {
    const data = await axiosLogin(userData)
    dispatch(resetVisitor())
    dispatch(resetGenerationUsage())
    dispatch(getGenerationUsage())
    return data
  } catch (e) {
    return toReject(e, rejectWithValue)
  }
})

export const registration = createAsyncThunk(
  'auth/register',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosRegister(userData)
      dispatch(resetVisitor())
      dispatch(resetGenerationUsage())
      dispatch(getGenerationUsage())

      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    await axiosLogout()
  } catch (e) {
    // no-op
  } finally {
    dispatch(clearUser())
    dispatch(resetGenerationUsage())
    dispatch(resetVisitor())
    dispatch(initVisitor())
  }
  return { ok: true }
})

export const getCurrentUser = createAsyncThunk(
  'auth/current',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosGetCurrentUser()

      if (data?.user) {
        dispatch(resetGenerationUsage())
        dispatch(getGenerationUsage())
      }

      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const editUser = createAsyncThunk(
  'auth/edit',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosEditUser(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
);

export const deleteUser = createAsyncThunk('auth/delete', async (userId, { dispatch }) => {
  try {
    await axiosDeleteUser(userId)
  } catch (e) {
    // no-op
  } finally {
    dispatch(clearUser())
    dispatch(resetGenerationUsage())
    dispatch(resetVisitor())
    dispatch(initVisitor())
  }
  return { ok: true }
})

export const forgotPassword = createAsyncThunk(
  'auth/forgot-password',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosForgotPassword(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)

export const resetPassword = createAsyncThunk(
  'auth/reset-password',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosResetPassword(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
)
