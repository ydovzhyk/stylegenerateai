import { useMemo, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getLogin, getUser } from '@/store/auth/auth-selectors'
import {
  DEFAULT_OUTPUT_FORMAT,
  OUTPUT_FORMATS,
} from '@/constants/output-formats'
import {
  DEFAULT_PHOTO_QUALITY,
  PHOTO_QUALITIES,
} from '@/constants/photo-quality'
import {
  getGenerationPlan,
  resolveFrontendPlanKey,
} from '@/config/generation-plans'

export function getLockedText({ planKey, isLogin }) {
  if (!isLogin) return 'Sign in to unlock this option.'
  if (planKey === 'free')
    return 'Upgrade to Basic or Pro to unlock this option.'
  if (planKey === 'basic') return 'Upgrade to Pro to unlock this option.'
  return 'This option is not available for your plan.'
}

export function getPlanHint({ planKey, activePlan }) {
  if (planKey === 'visitor') {
    return `Visitor plan includes ${activePlan.dailyLimit} demo generations in draft quality.`
  }

  if (planKey === 'free') {
    return `Free plan includes ${activePlan.dailyLimit} daily generations and ${activePlan.monthlyLimit} monthly generations.`
  }

  if (planKey === 'basic') {
    return `Basic plan includes more formats and ${activePlan.monthlyLimit} monthly generations.`
  }

  if (planKey === 'pro') {
    return `Pro plan unlocks premium quality and ${activePlan.monthlyLimit} monthly generations.`
  }

  if (planKey === 'admin') {
    return 'Admin mode has no generation limits.'
  }

  return 'Your current plan controls available formats, quality, and generation limits.'
}

function resolveAllowedValue(value, allowedValues = [], fallbackValue) {
  if (allowedValues.includes(value)) return value
  if (allowedValues.includes(fallbackValue)) return fallbackValue
  return allowedValues[0] || ''
}

export default function useGenerationPlanAccess() {
  const isLogin = useSelector(getLogin)
  const user = useSelector(getUser)

  const planKey = useMemo(
    () => resolveFrontendPlanKey(user, isLogin),
    [user, isLogin],
  )

  const activePlan = useMemo(() => getGenerationPlan(planKey), [planKey])

  const [selectedOutputFormat, setSelectedOutputFormat] = useState(
    DEFAULT_OUTPUT_FORMAT,
  )

  const [selectedPhotoQuality, setSelectedPhotoQuality] = useState(
    DEFAULT_PHOTO_QUALITY,
  )

  const outputFormat = useMemo(() => {
    return resolveAllowedValue(
      selectedOutputFormat,
      activePlan.allowedFormats,
      DEFAULT_OUTPUT_FORMAT,
    )
  }, [selectedOutputFormat, activePlan.allowedFormats])

  const photoQuality = useMemo(() => {
    return resolveAllowedValue(
      selectedPhotoQuality,
      activePlan.allowedQualities,
      DEFAULT_PHOTO_QUALITY,
    )
  }, [selectedPhotoQuality, activePlan.allowedQualities])

  const isFormatAllowed = useCallback(
    (id) => activePlan.allowedFormats.includes(id),
    [activePlan.allowedFormats],
  )

  const isQualityAllowed = useCallback(
    (id) => activePlan.allowedQualities.includes(id),
    [activePlan.allowedQualities],
  )

  const setOutputFormat = useCallback(
    (id) => {
      if (!activePlan.allowedFormats.includes(id)) return
      setSelectedOutputFormat(id)
    },
    [activePlan.allowedFormats],
  )

  const setPhotoQuality = useCallback(
    (id) => {
      if (!activePlan.allowedQualities.includes(id)) return
      setSelectedPhotoQuality(id)
    },
    [activePlan.allowedQualities],
  )

  const outputFormats = useMemo(() => Object.values(OUTPUT_FORMATS), [])
  const photoQualities = useMemo(() => Object.values(PHOTO_QUALITIES), [])

  const lockedText = useMemo(
    () => getLockedText({ planKey, isLogin }),
    [planKey, isLogin],
  )

  const planHint = useMemo(
    () => getPlanHint({ planKey, activePlan }),
    [planKey, activePlan],
  )

  return {
    isLogin,
    user,
    planKey,
    activePlan,

    outputFormat,
    setOutputFormat,

    photoQuality,
    setPhotoQuality,

    outputFormats,
    photoQualities,

    lockedText,
    planHint,

    isFormatAllowed,
    isQualityAllowed,
  }
}
