import { instance } from './instance'
import { resolveGenerationResponse } from './generation-job'

const AUTOGENERATE_MAX_WAIT_MS = 90 * 60 * 1000

export const axiosAutogenerateReadyTemplates = async (payload) => {
  const { data } = await instance.post('/autogenerate/ready-templates', payload)
  return resolveGenerationResponse(data, {
    maxWaitMs: AUTOGENERATE_MAX_WAIT_MS,
  })
}
