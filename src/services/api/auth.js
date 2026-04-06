import { instance } from './instance'

export const axiosRegister = async (userData) => {
  console.log('Registering user with data:', userData) // Debug log
  const { data } = await instance.post('/auth/register', userData)
  return data
}

export const axiosLogin = async (userData) => {
  const { data } = await instance.post('/auth/login', userData)
  return data
}

export const axiosLogout = async () => {
  const { data } = await instance.post('/auth/logout')
  return data
}

export const axiosGetCurrentUser = async () => {
  const { data } = await instance.get('/auth/current')
  return data
}

export const axiosEditUser = async (formData) => {
  const { data } = await instance.put('/auth/edit', formData)
  return data
}

export const axiosUpdateUser = async (userData) => {
  const { data } = await instance.post('/auth/update', userData)
  return data
}

export const axiosDeleteUser = async (id) => {
  const { data } = await instance.delete(`/auth/delete/${id}`)
  return { ok: true, status: data.status }
}

export const axiosForgotPassword = async (userData) => {
  const { data } = await instance.post('/auth/forgot-password', userData)
  return data
}

export const axiosResetPassword = async (userData) => {
  const { data } = await instance.post('/auth/reset-password', userData)
  return data
}