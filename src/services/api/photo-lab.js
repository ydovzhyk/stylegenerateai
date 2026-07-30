import { instance } from './instance'

export const axiosGeneratePhotoLabAdminPreview = async (formData) => {
  const { data } = await instance.post('/photo-lab/preview', formData)
  return data
}

export const axiosGeneratePhotoLabClientImage = async (formData) => {
  const { data } = await instance.post('/photo-lab/generate', formData)
  return data
}

export const axiosCreatePhotoLabTemplate = async (formData) => {
  const { data } = await instance.post('/photo-lab/templates', formData)
  return data
}

export const axiosGetPhotoLabTemplates = async () => {
  const { data } = await instance.get('/photo-lab/templates')
  return data
}

export const axiosDeletePhotoLabTemplate = async (id) => {
  const { data } = await instance.delete(`/photo-lab/templates/${id}`)
  return data
}