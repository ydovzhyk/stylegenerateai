import { createSlice } from '@reduxjs/toolkit'
import { sendAssistantMessage } from './assistant-operations'
import { generatePhotoLabClientImage } from '../photo-lab/photo-lab-operations'
import { generateYourLookClientImage } from '../ready-template/ready-template-operations'
import { detectChatLanguage } from '../../components/assistant/assistant-content'

export const ASSISTANT_HINTS_STORAGE_KEY = 'stylegenerateai.assistant.hints'
export const ASSISTANT_CHAT_LANGUAGE_STORAGE_KEY =
  'stylegenerateai.assistant.chat-language'

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function readAssistantHintsEnabled() {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(ASSISTANT_HINTS_STORAGE_KEY)
    if (raw == null) return true
    return raw !== 'false'
  } catch {
    return true
  }
}

export function writeAssistantHintsEnabled(enabled) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      ASSISTANT_HINTS_STORAGE_KEY,
      enabled ? 'true' : 'false',
    )
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export function readAssistantChatLanguage() {
  if (typeof window === 'undefined') return 'en'
  try {
    const raw = window.localStorage.getItem(ASSISTANT_CHAT_LANGUAGE_STORAGE_KEY)
    const code = String(raw || '').trim().toLowerCase()
    return code || 'en'
  } catch {
    return 'en'
  }
}

export function writeAssistantChatLanguage(code) {
  if (typeof window === 'undefined') return
  try {
    const next = String(code || '').trim().toLowerCase()
    if (!next) return
    window.localStorage.setItem(ASSISTANT_CHAT_LANGUAGE_STORAGE_KEY, next)
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

const initialState = {
  isOpen: false,
  messages: [],
  sending: false,
  error: null,
  proactive: null,
  hintsEnabled: true,
  hasOpenedChat: false,
  hasSentMessage: false,
  photoLabModeId: null,
  lastGenerationAt: null,
  lastProactiveAt: 0,
  chatLanguage: 'en',
}

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Could not send the message. Please try again.'

const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    setAssistantOpen: (state, action) => {
      state.isOpen = Boolean(action.payload)
      if (state.isOpen) {
        state.hasOpenedChat = true
        state.proactive = null
      }
    },
    toggleAssistantOpen: (state) => {
      state.isOpen = !state.isOpen
      if (state.isOpen) {
        state.hasOpenedChat = true
        state.proactive = null
      }
    },
    addAssistantLocalMessage: (state, action) => {
      const text = String(action.payload || '').trim()
      if (!text) return
      state.messages.push({
        id: makeId(),
        role: 'assistant',
        local: true,
        text,
        createdAt: Date.now(),
      })
    },
    showProactiveHint: (state, action) => {
      if (state.isOpen || state.hintsEnabled === false) return
      state.proactive = {
        id: makeId(),
        kind: action.payload?.kind || 'page',
        text: action.payload?.text || '',
        showAvatar: Boolean(action.payload?.showAvatar),
      }
      state.lastProactiveAt = Date.now()
    },
    hideProactiveHint: (state) => {
      state.proactive = null
    },
    setAssistantHintsEnabled: (state, action) => {
      state.hintsEnabled = Boolean(action.payload)
      if (!state.hintsEnabled) {
        state.proactive = null
      }
    },
    setAssistantPhotoLabMode: (state, action) => {
      state.photoLabModeId = action.payload || null
    },
    setAssistantChatLanguage: (state, action) => {
      const next = String(action.payload || '').trim().toLowerCase()
      if (!next) return
      state.chatLanguage = next
      writeAssistantChatLanguage(next)
    },
    clearAssistantError: (state) => {
      state.error = null
    },
    clearAssistantChat: (state) => {
      state.messages = []
      state.sending = false
      state.error = null
      state.hasSentMessage = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendAssistantMessage.pending, (state, { meta }) => {
        state.sending = true
        state.error = null
        state.hasSentMessage = true
        state.proactive = null
        const text = String(meta?.arg?.message || '').trim()
        if (text) {
          state.chatLanguage = detectChatLanguage(text, state.chatLanguage || 'en')
          writeAssistantChatLanguage(state.chatLanguage)
          state.messages.push({
            id: makeId(),
            role: 'user',
            text,
            createdAt: Date.now(),
          })
        }
      })
      .addCase(sendAssistantMessage.fulfilled, (state, { payload }) => {
        state.sending = false
        const reply = String(payload?.reply || '').trim()
        if (reply) {
          state.messages.push({
            id: makeId(),
            role: 'assistant',
            text: reply,
            createdAt: Date.now(),
          })
        }
      })
      .addCase(sendAssistantMessage.rejected, (state, { payload }) => {
        state.sending = false
        state.error = errMsg(payload)
      })
      .addCase(generatePhotoLabClientImage.fulfilled, (state) => {
        state.lastGenerationAt = Date.now()
      })
      .addCase(generateYourLookClientImage.fulfilled, (state) => {
        state.lastGenerationAt = Date.now()
      })
  },
})

export const {
  setAssistantOpen,
  toggleAssistantOpen,
  addAssistantLocalMessage,
  showProactiveHint,
  hideProactiveHint,
  setAssistantHintsEnabled,
  setAssistantPhotoLabMode,
  setAssistantChatLanguage,
  clearAssistantError,
  clearAssistantChat,
} = assistantSlice.actions

export default assistantSlice.reducer
