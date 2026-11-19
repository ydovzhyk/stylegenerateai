import { instance } from './instance'
import { resolveGenerationResponse } from './generation-job'

export async function axiosGenerateOnTheWall(formData) {
  const { data } = await instance.post('/on-the-wall/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return resolveGenerationResponse(data, formData)
}
