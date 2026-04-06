import { createSlice } from '@reduxjs/toolkit'
import {
  registration,
  login,
  logout,
  getCurrentUser,
  editUser,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
} from './auth-operations'

const initialState = {
  user: null,
  isLogin: null,
  isAuthChecked: false,
  loading: false,
  isRefreshing: false,
  error: null,
  message: null,
}

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

const applyAuthPayload = (state, payload) => {
  state.loading = false
  state.error = null
  state.message = null

  const user = payload?.user ?? null

  state.user = user
  state.isLogin = Boolean(user)
  state.isAuthChecked = true
}

const auth = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    clearUser: () => ({
      ...initialState,
      isLogin: false,
      isAuthChecked: true,
    }),

    clearAuthError: (state) => {
      state.error = null
    },

    clearAuthMessage: (state) => {
      state.message = null
    },

    setUser: (state, action) => {
      state.user = action.payload || null
      state.isLogin = Boolean(action.payload)
      state.isAuthChecked = true
    },
  },

  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registration.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(registration.fulfilled, (state, { payload }) => {
        applyAuthPayload(state, payload)
      })
      .addCase(registration.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        applyAuthPayload(state, payload)
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // LOGOUT
      .addCase(logout.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false
        state.isLogin = false
        state.isAuthChecked = true
        state.user = null
      })
      .addCase(logout.rejected, (state, { payload }) => {
        state.loading = false
        state.isLogin = false
        state.isAuthChecked = true
        state.user = null
        state.error = payload ? errMsg(payload) : null
        state.message = 'Logged out'
      })

      // GET CURRENT USER
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
        state.isRefreshing = true
        state.error = null
        state.message = null
      })
      .addCase(getCurrentUser.fulfilled, (state, { payload }) => {
        applyAuthPayload(state, payload)
        state.isRefreshing = false
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false
        state.isRefreshing = false
        state.isLogin = false
        state.isAuthChecked = true
        state.user = null
        state.error = null
      })

      // UPDATE USER (лайки/збереження)
      .addCase(updateUser.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        state.user = { ...state.user, ...payload?.user }
      })
      .addCase(updateUser.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })

      // EDIT USER (профіль)
      .addCase(editUser.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(editUser.fulfilled, (state, { payload }) => {
        state.loading = false
        state.user = { ...state.user, ...payload?.user }
        state.message = okMsg(payload, 'Profile updated')
      })
      .addCase(editUser.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // DELETE USER
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loading = false
        state.isLogin = false
        state.isAuthChecked = true
        state.user = null
        state.message = 'Your account has been deleted.'
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.loading = false
        state.isLogin = false
        state.isAuthChecked = true
        state.user = null
        state.error = payload ? errMsg(payload) : null
      })

      // FORGOT PASSWORD
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(forgotPassword.fulfilled, (state, { payload }) => {
        state.loading = false
        state.error = null
        state.message =
          payload?.message ||
          'Check your email and follow the password reset instructions.'
      })
      .addCase(forgotPassword.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(resetPassword.fulfilled, (state, { payload }) => {
        state.loading = false
        state.error = null
        state.message =
          payload?.message ||
          'Password has been reset successfully. Please sign in.'
      })
      .addCase(resetPassword.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export default auth.reducer

export const { clearUser, clearAuthError, clearAuthMessage, setUser } =
  auth.actions
