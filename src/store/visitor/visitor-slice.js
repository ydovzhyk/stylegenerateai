import { createSlice } from '@reduxjs/toolkit'
import { initVisitor, updateVisitor } from './visitor-operations'

const VISITOR_KEY = 'style-generate-ai:visitorId'

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Oops, something went wrong, try again'

const initialState = {
  id: null,
  visitor: null,
  error: null,
}

const visitorSlice = createSlice({
  name: 'visitor',
  initialState,

  reducers: {
    clearVisitorId(state) {
      state.id = null
      state.visitor = null

      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(VISITOR_KEY)
        }
      } catch {}
    },

    clearVisitorError(state) {
      state.error = null
    },

    resetVisitor(state) {
      state.id = null
      state.visitor = null
    },

    setVisitor(state, action) {
      state.visitor = action.payload || null
      state.id = action.payload?.visitorId || null
    },
  },

  extraReducers: (builder) => {
    builder
      // INIT VISITOR
      .addCase(initVisitor.pending, (state) => {
        state.error = null
      })
      .addCase(initVisitor.fulfilled, (state, { payload }) => {
        const vid = String(payload?.visitorId || '').trim()

        if (vid) state.id = vid
        state.visitor = payload || null
      })
      .addCase(initVisitor.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })

      // UPDATE VISITOR
      .addCase(updateVisitor.pending, (state) => {
        state.error = null
      })
      .addCase(updateVisitor.fulfilled, (state, { payload }) => {
        const vid = String(payload?.visitorId || '').trim()

        if (vid) state.id = vid
        state.visitor = payload || state.visitor
      })
      .addCase(updateVisitor.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
  },
})

export const { clearVisitorId, clearVisitorError, resetVisitor, setVisitor } =
  visitorSlice.actions

export default visitorSlice.reducer
