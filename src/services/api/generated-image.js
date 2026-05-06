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
