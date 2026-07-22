import { instance } from './instance'
import { resolveGenerationResponse } from './generation-job'

export const axiosGetCategories = async (params = {}) => {
  const { data } = await instance.get('/ready-templates/categories', {
    params,
  })
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

export const axiosGetYourLookPreviewTemplates = async (params = {}) => {
  const { limit = 5, excludeIds = [] } = params

  const { data } = await instance.get(
    '/ready-templates/get-your-look-preview',
    {
      params: {
        limit,
        excludeIds: excludeIds.join(','),
      },
    },
  )

  return data
}

export const axiosGetYourLookSearchTemplates = async (params = {}) => {
  const { query, selectedCategory, page, limit, railMode } = params

  const { data } = await instance.get('/ready-templates/get-your-look-search', {
    params: {
      query,
      category: selectedCategory,
      limit,
      page,
      railMode,
    },
  })

  return data
}

export const axiosGenerateYourLookClientImage = async (formData) => {
  const { data } = await instance.post(
    '/ready-templates/generate-your-look',
    formData,
  )
  return resolveGenerationResponse(data, formData)
}

export const axiosEditReadyTemplate = async (id, payload) => {
  const { data } = await instance.patch(`/ready-templates/${id}`, payload)
  return data
}

export const axiosDeleteReadyTemplate = async (id) => {
  const { data } = await instance.delete(`/ready-templates/${id}`)
  return data
}

export const axiosHideReadyTemplateFromCreateYourLook = async (id) => {
  const { data } = await instance.patch(
    `/ready-templates/${id}/hide-from-create-your-look`,
  )
  return data
}