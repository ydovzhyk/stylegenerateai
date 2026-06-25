import { instance } from './instance'

export const axiosCreateGeneratedImage = async (payload) => {
  const { data } = await instance.post('/generated-images', payload)
  return data
}

export const axiosCreateGeneratedImageFile = async (payload) => {
  const response = await instance.post('/generated-images', payload, {
    responseType: 'blob',
  })

  return {
    blob: response.data,
    contentType: response.headers['content-type'],
    fileFormat: response.headers['x-generated-image-format'],
  }
}

export const axiosFetchGeneratedImages = async (section) => {
  const { data } = await instance.get('/generated-images', {
    params: section ? { section } : undefined,
  })

  return data
}

export const axiosDeleteGeneratedImage = async (id) => {
  const { data } = await instance.delete(`/generated-images/${id}`)
  return data
}

export const axiosDownloadGeneratedImageFile = async (id) => {
  const response = await instance.get(`/generated-images/${id}/download`, {
    responseType: 'blob',
  })

  return {
    blob: response.data,
    contentType: response.headers['content-type'],
  }
}
