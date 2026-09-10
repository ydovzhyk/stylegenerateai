export const getAssistantIsOpen = (state) => state.assistant.isOpen
export const getAssistantMessages = (state) => state.assistant.messages
export const getAssistantSending = (state) => state.assistant.sending
export const getAssistantError = (state) => state.assistant.error
export const getAssistantProactive = (state) => state.assistant.proactive
export const getAssistantHintsEnabled = (state) =>
  state.assistant.hintsEnabled !== false
export const getAssistantHasOpenedChat = (state) => state.assistant.hasOpenedChat
export const getAssistantHasSentMessage = (state) =>
  state.assistant.hasSentMessage
export const getAssistantPhotoLabModeId = (state) =>
  state.assistant.photoLabModeId
export const getAssistantLastGenerationAt = (state) =>
  state.assistant.lastGenerationAt
export const getAssistantLastProactiveAt = (state) =>
  state.assistant.lastProactiveAt
export const getAssistantChatLanguage = (state) =>
  state.assistant.chatLanguage || 'en'
