'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  getLogin,
  getIsAuthChecked,
  getUser,
} from '@/store/auth/auth-selectors'

export default function AdminRoute({ children }) {
  const router = useRouter()
  const isLogin = useSelector(getLogin)
  const isAuthChecked = useSelector(getIsAuthChecked)
  const user = useSelector(getUser)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!isAuthChecked) return

    if (!isLogin) {
      router.replace('/')
      return
    }

    if (!isAdmin) {
      router.replace('/404')
    }
  }, [isLogin, isAuthChecked, isAdmin, router])

  if (!isAuthChecked) return null
  if (!isLogin) return null
  if (!isAdmin) return null

  return children
}
