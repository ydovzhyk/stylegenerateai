import { instance } from './instance'

export const axiosAutogenerateReadyTemplates = async (payload) => {
  const { data } = await instance.post('/autogenerate/ready-templates', payload)
  return data
}