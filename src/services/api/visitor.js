import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const visitorClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
})

export const axiosGetVisitor = async () => {
  const { data } = await visitorClient.get('/visitor/init')
  return data
}