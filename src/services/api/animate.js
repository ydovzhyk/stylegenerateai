import { instance } from './instance'
import { resolveGenerationResponse } from './generation-job'

export async function axiosGenerateAnimateVideo(formData) {
  const { data } = await instance.post('/animate/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Kling jobs can take several minutes.
    timeout: 10 * 60 * 1000,
  })

  return resolveGenerationResponse(data, formData)
}

export async function axiosGetAnimateStats() {
  const { data } = await instance.get('/animate/stats')
  return data
}

export async function axiosGetAnimateTemplates() {
  const { data } = await instance.get('/animate/templates')
  return data
}

export async function axiosCreateAnimateTemplate(formData) {
  const { data } = await instance.post('/animate/templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 5 * 60 * 1000,
  })
  return data
}

export async function axiosDeleteAnimateTemplate(id) {
  const { data } = await instance.delete(`/animate/templates/${id}`)
  return data
}
