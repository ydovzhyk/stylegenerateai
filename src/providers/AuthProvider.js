'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser } from '@/store/auth/auth-operations'
import { getLogin, getIsAuthChecked } from '@/store/auth/auth-selectors'
import { initVisitor } from '@/store/visitor/visitor-operations'
import { resetVisitor } from '@/store/visitor/visitor-slice'
import { getVisitorId } from '@/store/visitor/visitor-selectors'

export default function AuthProvider() {
  const dispatch = useDispatch()

  const isLogin = useSelector(getLogin)
  const isAuthChecked = useSelector(getIsAuthChecked)
  const visitorId = useSelector(getVisitorId)

  useEffect(() => {
    dispatch(getCurrentUser())
  }, [dispatch])

  useEffect(() => {
    if (!isAuthChecked) return

    if (isLogin === true) {
      dispatch(resetVisitor())
      return
    }

    if (isLogin === false && !visitorId) {
      dispatch(initVisitor())
    }
  }, [dispatch, isLogin, isAuthChecked, visitorId])

  return null
}
