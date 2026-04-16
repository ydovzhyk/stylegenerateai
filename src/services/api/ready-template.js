import { instance } from './instance'

export const axiosGetCategories = async () => {
  const { data } = await instance.get('/ready-templates/categories')
  return data
}

export const axiosResolvePromptMetadata = async (payload) => {
  const { data } = await instance.post(
    '/ready-templates/resolve-prompt-metadata',
    payload,
  )
  return data
}

export const axiosGenerateReadyTemplatePreview = async (formData) => {
  const { data } = await instance.post(
    '/ready-templates/generate-preview',
    formData,
  )
  return data
}
export const axiosCreateReadyTemplate = async (formData) => {
  const { data } = await instance.post('/ready-templates/create', formData)
  return data
}

export const axiosEditReadyTemplate = async (id, payload) => {
  const { data } = await instance.patch(`/ready-templates/${id}`, payload)
  return data
}

export const axiosDeleteReadyTemplate = async (id) => {
  const { data } = await instance.delete(`/ready-templates/${id}`)
  return data
}