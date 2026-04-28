import { createSlice } from '@reduxjs/toolkit'
import { getGenerationUsage } from './generation-usage-operations'

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Oops, something went wrong, try again'

const emptyUsage = {
  actorType: '',
  planKey: '',
  isUnlimited: false,
  dailyLimit: null,
  monthlyLimit: null,
  usedDaily: null,
  usedMonthly: null,
  remainingDaily: null,
  remainingMonthly: null,
}

const initialState = {
  error: null,
  message: null,
  generationUsageData: emptyUsage,
}

const generationUsage = createSlice({
  name: 'generation-usage',
  initialState,

  reducers: {
    clearGenerationUsageError: (state) => {
      state.error = null
    },
    clearGenerationUsageMessage: (state) => {
      state.message = null
    },
    resetGenerationUsage: (state) => {
      state.error = null
      state.message = null
      state.generationUsageData = emptyUsage
    },
    setGenerationUsage: (state, action) => {
      state.generationUsageData = action.payload || emptyUsage
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getGenerationUsage.pending, (state) => {
        state.message = null
        state.error = null
      })
      .addCase(getGenerationUsage.fulfilled, (state, { payload }) => {
        state.generationUsageData = payload?.usage || payload || emptyUsage
      })
      .addCase(getGenerationUsage.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
  },
})

export default generationUsage.reducer

export const {
  clearGenerationUsageError,
  clearGenerationUsageMessage,
  resetGenerationUsage,
  setGenerationUsage,
} = generationUsage.actions
