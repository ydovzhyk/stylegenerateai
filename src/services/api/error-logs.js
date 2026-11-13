import { instance } from './instance'

export async function axiosGetErrorLogs(params = {}) {
  const { data } = await instance.get('/error-logs', { params })
  return data
}

export async function axiosDeleteErrorLogs({ side, ids = [] } = {}) {
  const { data } = await instance.delete('/error-logs', {
    data: { side, ids },
  })
  return data
}
