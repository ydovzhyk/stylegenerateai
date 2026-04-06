'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { getLogin, getIsAuthChecked } from '@/store/auth/auth-selectors'

export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const isLogin = useSelector(getLogin)
  const isAuthChecked = useSelector(getIsAuthChecked)

  useEffect(() => {
    if (!isAuthChecked) return

    if (!isLogin) {
      router.replace('/')
    }
  }, [isLogin, isAuthChecked, router])

  if (!isAuthChecked) return null
  if (!isLogin) return null

  return children
}
