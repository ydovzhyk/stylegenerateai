import { instance } from './instance'
import { resolveGenerationResponse } from './generation-job'

export async function axiosGenerateImagine(formData) {
  const { data } = await instance.post('/imagine/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return resolveGenerationResponse(data, formData)
}

export async function axiosGetImagineTemplates() {
  const { data } = await instance.get('/imagine/templates')
  return data
}

export async function axiosCreateImagineTemplate(formData) {
  const { data } = await instance.post('/imagine/templates', formData)
  return data
}

export async function axiosDeleteImagineTemplate(id) {
  const { data } = await instance.delete(`/imagine/templates/${id}`)
  return data
}
