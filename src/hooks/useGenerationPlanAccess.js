import { useCallback, useMemo, useState } from 'react'
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
  DEFAULT_GENERATED_IMAGE_FORMAT,
  GENERATED_IMAGE_FORMATS,
} from '@/constants/generated-image-formats'

import {
  getGenerationPlan,
  getGenerationCreditCost,
  resolveFrontendPlanKey,
} from '@/config/generation-plans'

const FALLBACK_GENERATED_IMAGE_FORMATS = [DEFAULT_GENERATED_IMAGE_FORMAT]

export function getLockedText({ planKey, isLogin }) {
  if (!isLogin) return 'Sign in to unlock this option.'
  if (planKey === 'free') return 'Upgrade to a paid plan to unlock this option.'
  return 'This option is not available for your plan.'
}

export function getPlanHint({ planKey, activePlan }) {
  if (planKey === 'visitor') {
    return `Visitor plan includes ${activePlan.totalCredits} credits. Draft generation costs ${getGenerationCreditCost(
      'draft',
    )} credit.`
  }

  if (planKey === 'free') {
    return `Free plan includes ${activePlan.totalCredits} credits. Draft costs ${getGenerationCreditCost(
      'draft',
    )} credit, Standard costs ${getGenerationCreditCost('standard')} credits.`
  }

  if (planKey === 'basic') {
    return `Basic plan includes ${activePlan.totalCredits} credits for ${activePlan.durationDays} days. Draft costs ${getGenerationCreditCost(
      'draft',
    )}, Standard costs ${getGenerationCreditCost('standard')} credits.`
  }

  if (planKey === 'pro') {
    return `Pro plan includes ${activePlan.totalCredits} credits for ${activePlan.durationDays} days. Premium and Print modes are unlocked.`
  }

  if (planKey === 'admin') {
    return 'Admin mode has no generation limits.'
  }

  return 'Your current plan controls available formats, quality, and generation credits.'
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

  const [selectedGeneratedImageFormat, setSelectedGeneratedImageFormat] =
    useState(DEFAULT_GENERATED_IMAGE_FORMAT)

  const allowedGeneratedImageFormats = useMemo(() => {
    return (
      activePlan.allowedGeneratedImageFormats ||
      FALLBACK_GENERATED_IMAGE_FORMATS
    )
  }, [activePlan.allowedGeneratedImageFormats])

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

  const generatedImageFormat = useMemo(() => {
    return resolveAllowedValue(
      selectedGeneratedImageFormat,
      allowedGeneratedImageFormats,
      DEFAULT_GENERATED_IMAGE_FORMAT,
    )
  }, [selectedGeneratedImageFormat, allowedGeneratedImageFormats])

  const isFormatAllowed = useCallback(
    (id) => activePlan.allowedFormats.includes(id),
    [activePlan.allowedFormats],
  )

  const isQualityAllowed = useCallback(
    (id) => activePlan.allowedQualities.includes(id),
    [activePlan.allowedQualities],
  )

  const isGeneratedImageFormatAllowed = useCallback(
    (id) => allowedGeneratedImageFormats.includes(id),
    [allowedGeneratedImageFormats],
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

  const setGeneratedImageFormat = useCallback(
    (id) => {
      if (!allowedGeneratedImageFormats.includes(id)) return
      setSelectedGeneratedImageFormat(id)
    },
    [allowedGeneratedImageFormats],
  )

  return {
    isLogin,
    user,
    planKey,
    activePlan,

    outputFormat,
    setOutputFormat,
    outputFormats: Object.values(OUTPUT_FORMATS),

    photoQuality,
    setPhotoQuality,
    photoQualities: Object.values(PHOTO_QUALITIES),

    generatedImageFormat,
    setGeneratedImageFormat,
    generatedImageFormats: Object.values(GENERATED_IMAGE_FORMATS),

    lockedText: getLockedText({ planKey, isLogin }),
    planHint: getPlanHint({ planKey, activePlan }),

    isFormatAllowed,
    isQualityAllowed,
    isGeneratedImageFormatAllowed,
  }
}