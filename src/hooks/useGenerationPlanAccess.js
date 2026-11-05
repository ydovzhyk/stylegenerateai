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
  getAvailableOptionIds,
  getOptionCredits,
  getPlanDefinition,
  listPlanOptions,
  quoteGeneration,
  resolveFrontendPlanKey,
} from '@/config/generation-pricing'

export function getLockedText({ planKey, isLogin, lockedReason }) {
  if (planKey === 'admin') {
    return ''
  }

  if (lockedReason === 'sign_in_required' || (!isLogin && planKey === 'visitor')) {
    return 'Sign in to unlock this option.'
  }

  if (lockedReason === 'plan_pro_required') {
    return 'Upgrade to Pro to unlock this option.'
  }

  if (lockedReason === 'plan_basic_required') {
    return 'Upgrade to a paid plan to unlock this option.'
  }

  if (planKey === 'free') {
    return 'Upgrade to a paid plan to unlock Print.'
  }

  if (planKey === 'visitor') {
    return 'Sign in to unlock this option.'
  }

  return ''
}

export function getPlanHint({ planKey, activePlan, creditCost }) {
  if (planKey === 'admin') {
    return 'Admin mode has no generation limits.'
  }

  if (planKey === 'pro') {
    return `Pro plan includes ${activePlan.totalCredits} credits for ${activePlan.durationDays} days. Premium and Print modes are unlocked.`
  }

  if (planKey === 'basic') {
    return `Basic plan includes ${activePlan.totalCredits} credits for ${activePlan.durationDays} days.`
  }

  if (creditCost != null) {
    return `Your plan includes ${activePlan.totalCredits} credits. This generation costs ${creditCost} credit${creditCost === 1 ? '' : 's'}.`
  }

  return `Your plan includes ${activePlan.totalCredits} credits.`
}

function resolveAllowedValue(value, allowedValues = [], fallbackValue) {
  if (!allowedValues.length) return fallbackValue
  if (allowedValues.includes(value)) return value
  if (allowedValues.includes(fallbackValue)) return fallbackValue
  return allowedValues[0] || fallbackValue
}

export default function useGenerationPlanAccess({
  productKey = 'ready_template',
  modeKey = null,
  resetKey = null,
} = {}) {
  const isLogin = useSelector(getLogin)
  const user = useSelector(getUser)

  const planKey = useMemo(
    () => resolveFrontendPlanKey(user, isLogin),
    [user, isLogin],
  )

  const activePlan = useMemo(() => getPlanDefinition(planKey), [planKey])

  const planOptions = useMemo(() => {
    try {
      return listPlanOptions({ productKey, modeKey, planKey })
    } catch {
      return {
        modeAccess: { available: false },
        pricing: {},
        options: {},
      }
    }
  }, [productKey, modeKey, planKey])

  const allowedQualities = useMemo(
    () =>
      getAvailableOptionIds(planOptions.options, 'photoQuality').filter(
        (id) => id !== 'draft',
      ),
    [planOptions.options],
  )

  const allowedFormats = useMemo(
    () => getAvailableOptionIds(planOptions.options, 'outputFormat'),
    [planOptions.options],
  )

  const allowedGeneratedImageFormats = useMemo(() => {
    const fromLibrary = getAvailableOptionIds(
      planOptions.options,
      'generatedImageFormat',
    )

    return fromLibrary.length
      ? fromLibrary
      : Object.keys(GENERATED_IMAGE_FORMATS)
  }, [planOptions.options])

  const defaultPhotoQuality = useMemo(() => {
    return allowedQualities.includes(DEFAULT_PHOTO_QUALITY)
      ? DEFAULT_PHOTO_QUALITY
      : allowedQualities[0] || DEFAULT_PHOTO_QUALITY
  }, [allowedQualities])

  const defaultOutputFormat = allowedFormats.includes(DEFAULT_OUTPUT_FORMAT)
    ? DEFAULT_OUTPUT_FORMAT
    : allowedFormats[0] || DEFAULT_OUTPUT_FORMAT

  const [selectedOutputFormat, setSelectedOutputFormat] = useState(
    defaultOutputFormat,
  )
  const [selectedPhotoQuality, setSelectedPhotoQuality] = useState(
    defaultPhotoQuality,
  )
  const defaultGeneratedImageFormat =
    allowedGeneratedImageFormats.includes(DEFAULT_GENERATED_IMAGE_FORMAT)
      ? DEFAULT_GENERATED_IMAGE_FORMAT
      : allowedGeneratedImageFormats[0] || DEFAULT_GENERATED_IMAGE_FORMAT
  const [selectedGeneratedImageFormat, setSelectedGeneratedImageFormat] =
    useState(defaultGeneratedImageFormat)

  const selectionResetKey = [
    resetKey,
    productKey,
    modeKey,
    planKey,
    defaultPhotoQuality,
    defaultOutputFormat,
    defaultGeneratedImageFormat,
  ].join('|')

  const [prevSelectionResetKey, setPrevSelectionResetKey] =
    useState(selectionResetKey)

  if (selectionResetKey !== prevSelectionResetKey) {
    setPrevSelectionResetKey(selectionResetKey)
    setSelectedPhotoQuality(defaultPhotoQuality)
    setSelectedOutputFormat(defaultOutputFormat)
    setSelectedGeneratedImageFormat(defaultGeneratedImageFormat)
  }

  const outputFormat = useMemo(() => {
    return resolveAllowedValue(
      selectedOutputFormat,
      allowedFormats,
      defaultOutputFormat,
    )
  }, [
    selectedOutputFormat,
    allowedFormats,
    defaultOutputFormat,
  ])

  const photoQuality = useMemo(() => {
    return resolveAllowedValue(
      selectedPhotoQuality,
      allowedQualities,
      defaultPhotoQuality,
    )
  }, [
    selectedPhotoQuality,
    allowedQualities,
    defaultPhotoQuality,
  ])

  const generatedImageFormat = useMemo(() => {
    return resolveAllowedValue(
      selectedGeneratedImageFormat,
      allowedGeneratedImageFormats,
      defaultGeneratedImageFormat,
    )
  }, [
    selectedGeneratedImageFormat,
    allowedGeneratedImageFormats,
    defaultGeneratedImageFormat,
  ])

  // Export size is chosen before Generate and billed with the generation.
  const generationQuote = useMemo(() => {
    const selections = {
      photoQuality,
      outputFormat,
    }

    return quoteGeneration({
      planKey,
      productKey,
      modeKey,
      selections,
    })
  }, [planKey, productKey, modeKey, photoQuality, outputFormat])

  const exportQuote = useMemo(() => {
    return quoteGeneration({
      planKey,
      productKey,
      modeKey,
      selections: {
        photoQuality,
        outputFormat,
      },
    })
  }, [planKey, productKey, modeKey, photoQuality, outputFormat])

  const getOptionLockedReason = useCallback(
    (groupKey, optionId) => {
      return planOptions.options?.[groupKey]?.[optionId]?.lockedReason || null
    },
    [planOptions.options],
  )

  const isFormatAllowed = useCallback(
    (id) => allowedFormats.includes(id),
    [allowedFormats],
  )

  const isQualityAllowed = useCallback(
    (id) => allowedQualities.includes(id),
    [allowedQualities],
  )

  const isGeneratedImageFormatAllowed = useCallback(
    (id) => allowedGeneratedImageFormats.includes(id),
    [allowedGeneratedImageFormats],
  )

  const getQualityCredits = useCallback(
    (id) =>
      getOptionCredits({
        planKey,
        productKey,
        modeKey,
        groupKey: 'photoQuality',
        optionId: id,
      }),
    [planKey, productKey, modeKey],
  )

  const getFormatCredits = useCallback(
    (id) =>
      getOptionCredits({
        planKey,
        productKey,
        modeKey,
        groupKey: 'outputFormat',
        optionId: id,
      }),
    [planKey, productKey, modeKey],
  )

  const setOutputFormat = useCallback(
    (id) => {
      if (!allowedFormats.includes(id)) return
      setSelectedOutputFormat(id)
    },
    [allowedFormats],
  )

  const setPhotoQuality = useCallback(
    (id) => {
      if (!allowedQualities.includes(id)) return
      setSelectedPhotoQuality(id)
    },
    [allowedQualities],
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
    productKey,
    modeKey,
    modeAccess: planOptions.modeAccess,

    outputFormat,
    setOutputFormat,
    outputFormats: Object.values(OUTPUT_FORMATS),

    photoQuality,
    setPhotoQuality,
    photoQualities: Object.values(PHOTO_QUALITIES),

    generatedImageFormat,
    setGeneratedImageFormat,
    generatedImageFormats: Object.values(GENERATED_IMAGE_FORMATS),

    creditCost: generationQuote.totalCredits,
    /** @deprecated Export size is billed on generate; download is format-only. */
    exportCreditCost: 0,
    qualityCreditCost: Math.max(
      0,
      Number(getQualityCredits(photoQuality) || 0),
    ),
    exportQuote,
    creditBreakdown: generationQuote.breakdown,
    generationQuote,
    canGenerate: generationQuote.allowed === true,

    lockedText: getLockedText({ planKey, isLogin }),
    planHint: getPlanHint({
      planKey,
      activePlan,
      creditCost: generationQuote.totalCredits,
    }),

    isFormatAllowed,
    isQualityAllowed,
    isGeneratedImageFormatAllowed,
    getOptionLockedReason,
    getQualityCredits,
    getFormatCredits,
  }
}
