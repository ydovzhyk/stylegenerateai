import { instance } from './instance'

export const axiosChatWithAssistant = async (payload) => {
  const { data } = await instance.post('/assistant/chat', payload)
  return data
}
