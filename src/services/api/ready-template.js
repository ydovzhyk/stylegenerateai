import { instance } from './instance'

export const createReadyTemplate = async (formData) => {
  const { data } = await instance.post('/ready-templates/create', formData)
  return data
}