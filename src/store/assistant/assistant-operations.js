import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosChatWithAssistant } from '@/services/api/assistant'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || {
    message: error?.message || 'Request failed',
  }
  return rejectWithValue({ status, data })
}

export const sendAssistantMessage = createAsyncThunk(
  'assistant/send-message',
  async ({ message, history, page, photoLabModeId }, { rejectWithValue }) => {
    try {
      return await axiosChatWithAssistant({
        message,
        history,
        page,
        photoLabModeId,
      })
    } catch (error) {
      return toReject(error, rejectWithValue)
    }
  },
)
