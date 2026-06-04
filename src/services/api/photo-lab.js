import { instance } from './instance'

export const axiosGeneratePhotoLabAdminPreview = async (formData) => {
  const { data } = await instance.post('/photo-lab/admin/preview', formData)
  return data
}
