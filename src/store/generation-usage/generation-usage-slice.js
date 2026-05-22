import { createSlice } from '@reduxjs/toolkit'
import { getGenerationUsage } from './generation-usage-operations'

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Oops, something went wrong, try again'

const emptyUsageByType = {
  draft: { count: 0, creditsUsed: 0 },
  standard: { count: 0, creditsUsed: 0 },
  premium: { count: 0, creditsUsed: 0 },
  print: { count: 0, creditsUsed: 0 },
}

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

  usageByType: emptyUsageByType,
  generationType: null,
  creditCost: 0,
  usedCreditsNow: 0,
  usedCredits: 0,
  totalCredits: null,
  remainingCredits: null,
}

const normalizeUsage = (payload) => {
  const usage = payload?.usage || payload || emptyUsage

  return {
    ...emptyUsage,
    ...usage,
    usageByType: {
      ...emptyUsageByType,
      ...(usage?.usageByType || {}),
    },
  }
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
      state.generationUsageData = normalizeUsage(action.payload)
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getGenerationUsage.pending, (state) => {
        state.message = null
        state.error = null
      })
      .addCase(getGenerationUsage.fulfilled, (state, { payload }) => {
        state.generationUsageData = normalizeUsage(payload)
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