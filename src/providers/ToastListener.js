'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import { isAssistantHiddenPath } from '@/components/assistant/assistant-content'
import { queueAssistantNotice } from '@/store/assistant/assistant-slice'

import { useLanguage } from '@/providers/languageContext'
import { translateMyText } from '@/utils/translate/translate'

import { getAuthError, getAuthMessage } from '@/store/auth/auth-selectors'
import { clearAuthError, clearAuthMessage } from '@/store/auth/auth-slice'
import {
  getReadyTemplateError,
  getReadyTemplateMessage,
} from '@/store/ready-template/ready-template-selectors'
import {
  clearReadyTemplateError,
  clearReadyTemplateMessage,
} from '@/store/ready-template/ready-template-slice'
import {
  getGenerationUsageError,
  getGenerationUsageMessage,
} from '@/store/generation-usage/generation-usage-selectors'

import {
  clearGenerationUsageError,
  clearGenerationUsageMessage,
} from '@/store/generation-usage/generation-usage-slice'

import {
  getGeneratedImageError,
  getGeneratedImageMessage,
} from '@/store/generated-image/generated-image-selectors'

import {
  clearGeneratedImageError,
  clearGeneratedImageMessage,
} from '@/store/generated-image/generated-image-slice'

import {
  getPhotoLabError,
  getPhotoLabMessage,
} from '@/store/photo-lab/photo-lab-selectors'

import {
  clearPhotoLabError,
  clearPhotoLabMessage,
} from '@/store/photo-lab/photo-lab-slice'
import { getImagineError, getImagineMessage } from '@/store/imagine/imagine-selectors'
import {
  clearImagineError,
  clearImagineMessage,
} from '@/store/imagine/imagine-slice'

const TOAST_DEDUPE_WINDOW_MS = 900

const toastBaseOptions = {
  position: 'top-right',
  autoClose: 3200,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

const toStr = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value.message || value.error || JSON.stringify(value)
  }
  return String(value)
}

function useToastPair({ error, message, clearError, clearMessage }) {
  const dispatch = useDispatch()
  const pathname = usePathname()
  const { languageIndex, hydrated } = useLanguage()

  const lastErrorRef = useRef({ text: '', ts: 0 })
  const lastMessageRef = useRef({ text: '', ts: 0 })

  useEffect(() => {
    const raw = toStr(error)
    if (!raw || !hydrated) return

    const now = Date.now()
    const isDuplicate =
      lastErrorRef.current.text === raw &&
      now - lastErrorRef.current.ts < TOAST_DEDUPE_WINDOW_MS

    if (isDuplicate) {
      dispatch(clearError())
      return
    }

    lastErrorRef.current = { text: raw, ts: now }

    let cancelled = false

    ;(async () => {
      const translated = await translateMyText(raw, languageIndex)
      if (cancelled) return

      toast.error(translated || raw, {
        ...toastBaseOptions,
        className: 'sg-toast sg-toast--error',
        bodyClassName: 'sg-toast__body',
        progressClassName: 'sg-toast__progress sg-toast__progress--error',
      })

      if (!isAssistantHiddenPath(pathname)) {
        dispatch(queueAssistantNotice({ message: raw }))
      }

      dispatch(clearError())
    })()

    return () => {
      cancelled = true
    }
  }, [error, hydrated, languageIndex, dispatch, clearError, pathname])

  useEffect(() => {
    const raw = toStr(message)
    if (!raw || !hydrated) return

    const now = Date.now()
    const isDuplicate =
      lastMessageRef.current.text === raw &&
      now - lastMessageRef.current.ts < TOAST_DEDUPE_WINDOW_MS

    if (isDuplicate) {
      dispatch(clearMessage())
      return
    }

    lastMessageRef.current = { text: raw, ts: now }

    let cancelled = false

    ;(async () => {
      const translated = await translateMyText(raw, languageIndex)
      if (cancelled) return

      toast.success(translated || raw, {
        ...toastBaseOptions,
        className: 'sg-toast sg-toast--success',
        bodyClassName: 'sg-toast__body',
        progressClassName: 'sg-toast__progress sg-toast__progress--success',
      })

      dispatch(clearMessage())
    })()

    return () => {
      cancelled = true
    }
  }, [message, hydrated, languageIndex, dispatch, clearMessage])
}

export default function ToastListener() {
  const authError = useSelector(getAuthError)
  const authMessage = useSelector(getAuthMessage)

  const readyTemplateError = useSelector(getReadyTemplateError)
  const readyTemplateMessage = useSelector(getReadyTemplateMessage)

  const generationUsageError = useSelector(getGenerationUsageError)
  const generationUsageMessage = useSelector(getGenerationUsageMessage)

  const generatedImageError = useSelector(getGeneratedImageError)
  const generatedImageMessage = useSelector(getGeneratedImageMessage)

  const photoLabError = useSelector(getPhotoLabError)
  const photoLabMessage = useSelector(getPhotoLabMessage)

  const imagineError = useSelector(getImagineError)
  const imagineMessage = useSelector(getImagineMessage)

  useToastPair({
    error: authError,
    message: authMessage,
    clearError: clearAuthError,
    clearMessage: clearAuthMessage,
  })

  useToastPair({
    error: readyTemplateError,
    message: readyTemplateMessage,
    clearError: clearReadyTemplateError,
    clearMessage: clearReadyTemplateMessage,
  })

  useToastPair({
    error: generationUsageError,
    message: generationUsageMessage,
    clearError: clearGenerationUsageError,
    clearMessage: clearGenerationUsageMessage,
  })

  useToastPair({
    error: generatedImageError,
    message: generatedImageMessage,
    clearError: clearGeneratedImageError,
    clearMessage: clearGeneratedImageMessage,
  })

  useToastPair({
    error: photoLabError,
    message: photoLabMessage,
    clearError: clearPhotoLabError,
    clearMessage: clearPhotoLabMessage,
  })

  useToastPair({
    error: imagineError,
    message: imagineMessage,
    clearError: clearImagineError,
    clearMessage: clearImagineMessage,
  })

  return null
}
