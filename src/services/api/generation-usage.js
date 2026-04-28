import { instance } from './instance'

export const axiosGetGenerationUsage = async () => {
  const { data } = await instance.get('/generation-usage')
  return data
}