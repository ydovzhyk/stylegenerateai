import { instance } from './instance'

export async function axiosGetCostBalances(params = {}) {
  const { data } = await instance.get('/cost/balances', { params })
  return data
}

export async function axiosPostCostBalance(payload) {
  const { data } = await instance.post('/cost/balances', payload)
  return data
}

export async function axiosGetCostReport(params = {}) {
  const { data } = await instance.get('/cost/report', { params })
  return data
}

export async function axiosDeleteCostUsage(ids = []) {
  const { data } = await instance.delete('/cost/usage', {
    data: { ids },
  })
  return data
}

export async function axiosGetCostRates(params = {}) {
  const { data } = await instance.get('/cost/rates', { params })
  return data
}

export async function axiosPostCostRate(payload) {
  const { data } = await instance.post('/cost/rates', payload)
  return data
}

export async function axiosDeleteCostRates(ids = []) {
  const { data } = await instance.delete('/cost/rates', {
    data: { ids },
  })
  return data
}
